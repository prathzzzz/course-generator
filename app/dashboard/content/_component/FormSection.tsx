'use client'
import React, { useState, useEffect } from 'react'
import { TEMPLATE } from '../../_components/TemplateListSection'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2Icon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface PROPS {
    selectedTemplate?: TEMPLATE,
    userFormInput: any,
    loading: boolean,
}

function FormSection({ selectedTemplate, userFormInput, loading }: PROPS) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [showCustomTopic, setShowCustomTopic] = useState(false);
    const searchParams = useSearchParams()
    
    useEffect(() => {
        const topic = searchParams.get('topic')
        if (topic && selectedTemplate?.slug === 'generate-dsa-course') {
            setFormData(prevData => ({ ...prevData, topic, language: 'Python' }))
            handleSubmit({ topic, language: 'Python' })
        }
    }, [searchParams, selectedTemplate])

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        if (name === 'topic' && value === 'Custom') {
            setShowCustomTopic(true);
        } else if (name === 'topic') {
            setShowCustomTopic(false);
        }
        setFormData(prevData => ({ ...prevData, [name]: value }));
    }

    const handleSubmit = (data: Record<string, string>) => {
        if (!selectedTemplate) {
            console.error('No template selected');
            return;
        }

        let generatedPrompt = selectedTemplate.aiPrompt || '';
        
        selectedTemplate.form?.forEach(item => {
            const placeholder = `{${item.name}}`;
            let value = data[item.name];
            if (item.name === 'topic' && value === 'Custom') {
                value = data['customTopic'];
            }
            if (generatedPrompt.includes(placeholder)) {
                generatedPrompt = generatedPrompt.replace(placeholder, value || '');
            }
        });

        userFormInput({ ...data, aiPrompt: generatedPrompt });
    }

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSubmit(formData);
    }

    return (
        <div className='p-5 shadow-md border rounded-lg bg-white'>
            {/* @ts-ignore */}
            <Image src={selectedTemplate?.icon} alt='icon' width={70} height={70} />
            <h2 className='font-bold text-2xl mb-2 text-primary'>{selectedTemplate?.name}</h2>
            <p className='text-gray-500 text-sm'>{selectedTemplate?.desc}</p>

            <form className='mt-6' onSubmit={onSubmit}>
                {selectedTemplate?.form?.map((item, index) => (
                    <div key={index} className='my-2 flex flex-col gap-2 mb-7'>
                        <label className='font-bold'>{item.label}</label>
                        {item.field === 'select' ? (
                            <select 
                                name={item.name} 
                                required={item?.required} 
                                onChange={handleInputChange}
                                value={formData[item.name] || ''}
                            >
                                <option value="">Select an option</option>
                                {item.options.map((option, idx) => (
                                    <option key={idx} value={option}>{option}</option>
                                ))}
                            </select>
                        ) : item.field === 'input' ? (
                            (item.name !== 'customTopic' || showCustomTopic) && (
                                <Input 
                                    name={item.name} 
                                    required={item?.required || (item.name === 'customTopic' && showCustomTopic)} 
                                    onChange={handleInputChange} 
                                    value={formData[item.name] || ''} 
                                />
                            )
                        ) : item.field === 'textarea' ? (
                            <Textarea name={item.name} required={item?.required} onChange={handleInputChange} value={formData[item.name] || ''} />
                        ) : null}
                    </div>
                ))}
                <Button type='submit' className='w-full py-6' disabled={loading}>
                    {loading && <Loader2Icon className='animate-spin' />} Generate
                </Button>
            </form>
        </div>
    )
}

export default FormSection
