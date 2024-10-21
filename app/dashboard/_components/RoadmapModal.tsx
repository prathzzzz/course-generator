import React, { useState } from 'react'
import { Tree, TreeNode } from 'react-organizational-chart'
import styled from 'styled-components'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const StyledNode = styled.div`
  padding: 10px 15px;
  border-radius: 12px;
  display: inline-block;
  border: 2px solid #3b82f6;
  background-color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-weight: 600;
  color: #1e3a8a;
  transition: all 0.3s ease;

  &:hover {
    background-color: #3b82f6;
    color: #fff;
    transform: scale(1.05);
  }
`

const LanguageModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`

const RoadmapScreen: React.FC = () => {
  const router = useRouter()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  const handleNodeClick = (topic: string) => {
    const specificTopics = [
      'Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Binary Trees', 
      'Binary Search Trees', 'AVL Trees', 'Graphs', 'Heaps', 'Hash Tables',
      'Bubble Sort', 'Selection Sort', 'Insertion Sort', 'Merge Sort', 'Quick Sort',
      'Linear Search', 'Binary Search', 'BFS', 'DFS', 'Dijkstra\'s Algorithm'
    ]
    
    if (specificTopics.includes(topic)) {
      setSelectedTopic(topic)
    } else {
      // For broader categories, just navigate to the roadmap
      router.push(`/dashboard/roadmap/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, '-'))}`)
    }
  }

  const handleLanguageSelect = (language: string) => {
    if (selectedTopic) {
      router.push(`/dashboard/content/generate-dsa-course?topic=${encodeURIComponent(selectedTopic)}&language=${encodeURIComponent(language)}`)
    }
    setSelectedTopic(null)
  }

  const RoadmapNode: React.FC<{ label: string }> = ({ label }) => (
    <StyledNode onClick={() => handleNodeClick(label)}>{label}</StyledNode>
  )

  const predefinedLanguages = ['C', 'C++', 'Java', 'Python', 'JavaScript']

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Data Structures & Algorithms Roadmap</h1>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300">
            Back to Dashboard
          </Link>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg overflow-auto">
          <Tree
            lineWidth={'2px'}
            lineColor={'#3b82f6'}
            lineBorderRadius={'10px'}
            label={<RoadmapNode label="Data Structures & Algorithms" />}
          >
            <TreeNode label={<RoadmapNode label="Basic Data Structures" />}>
              <TreeNode label={<RoadmapNode label="Arrays" />} />
              <TreeNode label={<RoadmapNode label="Linked Lists" />} />
              <TreeNode label={<RoadmapNode label="Stacks" />} />
              <TreeNode label={<RoadmapNode label="Queues" />} />
            </TreeNode>
            <TreeNode label={<RoadmapNode label="Advanced Data Structures" />}>
              <TreeNode label={<RoadmapNode label="Trees" />}>
                <TreeNode label={<RoadmapNode label="Binary Trees" />} />
                <TreeNode label={<RoadmapNode label="Binary Search Trees" />} />
                <TreeNode label={<RoadmapNode label="AVL Trees" />} />
              </TreeNode>
              <TreeNode label={<RoadmapNode label="Graphs" />} />
              <TreeNode label={<RoadmapNode label="Heaps" />} />
              <TreeNode label={<RoadmapNode label="Hash Tables" />} />
            </TreeNode>
            <TreeNode label={<RoadmapNode label="Algorithms" />}>
              <TreeNode label={<RoadmapNode label="Sorting" />}>
                <TreeNode label={<RoadmapNode label="Bubble Sort" />} />
                <TreeNode label={<RoadmapNode label="Selection Sort" />} />
                <TreeNode label={<RoadmapNode label="Insertion Sort" />} />
                <TreeNode label={<RoadmapNode label="Merge Sort" />} />
                <TreeNode label={<RoadmapNode label="Quick Sort" />} />
              </TreeNode>
              <TreeNode label={<RoadmapNode label="Searching" />}>
                <TreeNode label={<RoadmapNode label="Linear Search" />} />
                <TreeNode label={<RoadmapNode label="Binary Search" />} />
              </TreeNode>
              <TreeNode label={<RoadmapNode label="Graph Algorithms" />}>
                <TreeNode label={<RoadmapNode label="BFS" />} />
                <TreeNode label={<RoadmapNode label="DFS" />} />
                <TreeNode label={<RoadmapNode label="Dijkstra's Algorithm" />} />
              </TreeNode>
              <TreeNode label={<RoadmapNode label="Dynamic Programming" />} />
            </TreeNode>
          </Tree>
        </div>
      </div>
      {selectedTopic && (
        <LanguageModal>
          <ModalContent>
            <h2 className="text-xl font-bold mb-4">Select a programming language for {selectedTopic}</h2>
            <div className="flex flex-wrap gap-2">
              {predefinedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageSelect(lang)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                >
                  {lang}
                </button>
              ))}
            </div>
          </ModalContent>
        </LanguageModal>
      )}
    </div>
  )
}

export default RoadmapScreen