"use client"
import React from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import styled from 'styled-components';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const StyledNode = styled.div`
  padding: 6px 10px;
  border-radius: 6px;
  display: inline-block;
  border: 1px solid #3b82f6;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: 600;
  font-size: 0.8rem;
  color: #1e3a8a;
  transition: all 0.3s ease;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background-color: #3b82f6;
    color: #fff;
    transform: scale(1.05);
  }
`;

const RoadmapWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 2rem;
`;

const VerticalTree = styled(Tree)`
  display: flex;
  flex-direction: column;
  align-items: center;

  .rst__lineHalfHorizontalRight::before,
  .rst__lineFullVertical::after,
  .rst__lineHalfVerticalTop::after,
  .rst__lineHalfVerticalBottom::after {
    width: 1px;
    left: 50%;
  }

  .rst__lineChildren::after {
    height: 15px;
  }
`;

const VerticalTreeNode = styled(TreeNode)`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const RoadmapPage = () => {
  const router = useRouter();

  const handleNodeClick = (topic: string) => {
    router.push(`/dashboard/content/generate-dsa-course?topic=${encodeURIComponent(topic)}`);
  };

  const renderNode = (label: string) => (
    <StyledNode onClick={() => handleNodeClick(label)}>{label}</StyledNode>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Data Structures & Algorithms Roadmap</h1>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-grow bg-white p-4 overflow-x-auto">
        <RoadmapWrapper>
          <VerticalTree
            lineWidth={'1px'}
            lineColor={'#3b82f6'}
            lineBorderRadius={'4px'}
            label={renderNode('Data Structures & Algorithms')}
          >
            <VerticalTreeNode label={renderNode('Basic Data Structures')}>
              <VerticalTreeNode label={renderNode('Arrays')} />
              <VerticalTreeNode label={renderNode('Linked Lists')} />
              <VerticalTreeNode label={renderNode('Stacks')} />
              <VerticalTreeNode label={renderNode('Queues')} />
            </VerticalTreeNode>
            <VerticalTreeNode label={renderNode('Advanced Data Structures')}>
              <VerticalTreeNode label={renderNode('Trees')}>
                <VerticalTreeNode label={renderNode('Binary Trees')} />
                <VerticalTreeNode label={renderNode('Binary Search Trees')} />
                <VerticalTreeNode label={renderNode('AVL Trees')} />
              </VerticalTreeNode>
              <VerticalTreeNode label={renderNode('Graphs')} />
              <VerticalTreeNode label={renderNode('Heaps')} />
              <VerticalTreeNode label={renderNode('Hash Tables')} />
            </VerticalTreeNode>
            <VerticalTreeNode label={renderNode('Algorithms')}>
              <VerticalTreeNode label={renderNode('Sorting')}>
                <VerticalTreeNode label={renderNode('Bubble Sort')} />
                <VerticalTreeNode label={renderNode('Selection Sort')} />
                <VerticalTreeNode label={renderNode('Insertion Sort')} />
                <VerticalTreeNode label={renderNode('Merge Sort')} />
                <VerticalTreeNode label={renderNode('Quick Sort')} />
              </VerticalTreeNode>
              <VerticalTreeNode label={renderNode('Searching')}>
                <VerticalTreeNode label={renderNode('Linear Search')} />
                <VerticalTreeNode label={renderNode('Binary Search')} />
              </VerticalTreeNode>
              <VerticalTreeNode label={renderNode('Graph Algorithms')}>
                <VerticalTreeNode label={renderNode('BFS')} />
                <VerticalTreeNode label={renderNode('DFS')} />
                <VerticalTreeNode label={renderNode('Dijkstra\'s Algorithm')} />
              </VerticalTreeNode>
              <VerticalTreeNode label={renderNode('Dynamic Programming')} />
            </VerticalTreeNode>
          </VerticalTree>
        </RoadmapWrapper>
      </div>
    </div>
  );
};

export default RoadmapPage;