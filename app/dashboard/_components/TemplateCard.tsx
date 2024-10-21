import React from 'react'
import { TEMPLATE } from './TemplateListSection'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function TemplateCard(item: TEMPLATE) {
  return (
    <div className='p-5 shadow-md rounded-md border bg-white flex flex-col gap-3'>
      <Link href={'/dashboard/content/' + item?.slug}>
        <div className='flex flex-col gap-3 cursor-pointer hover:scale-105 transition-all'>
          <Image src={item.icon} alt='icon' width={50} height={50} />
          <h2 className='font-medium text-lg'>{item.name}</h2>
          <p className='text-grey-500 text-clamp-3'>{item.desc}</p>
        </div>
      </Link>
      <Link href={`/dashboard/roadmap/${item.slug}`}>
        <Button className="w-full">Show Roadmap</Button>
      </Link>
    </div>
  )
}

export default TemplateCard
