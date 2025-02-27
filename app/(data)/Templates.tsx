export default [
  {
    name: 'DSA Course Generator',
    desc: 'Select a DSA topic and programming language to get detailed explanations and code snippets',
    category: 'Education',
    icon: 'https://cdn-icons-png.flaticon.com/128/2621/2621080.png',
    aiPrompt: 'Generate a detailed explanation with code snippets for the topic "{topic}" using the "{language}" programming language.',
    slug: 'generate-dsa-course',
    form: [
      {
        label: 'Select or Enter DSA Topic',
        name: 'topic',
        field: 'select',
        options: [
          'Custom', 'Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Binary Trees', 'Graphs', 'Dynamic Programming', 'Sorting Algorithms', 'Searching Algorithms'
        ],
        required: true
      },
      {
        label: 'Custom Topic',
        name: 'customTopic',
        field: 'input',
        required: false
      },
      {
        label: 'Select Programming Language',
        name: 'language',
        field: 'select',
        options: [
          'Python', 'Java', 'C++', 'JavaScript', 'C#'
        ],
        required: true
      }
    ]
  },
  {
    name: 'AI Mock Interview',
    desc: 'Practice technical interviews with AI-powered questions and real-time feedback',
    category: 'Interview Prep',
    icon: 'https://cdn-icons-png.flaticon.com/128/9464/9464456.png',
    aiPrompt: `You are an expert technical interviewer. Generate a concise technical interview question for a {role} position focused on {topic}. Keep the question focused and brief. Include:

1. A short context (1-2 sentences)
2. Clear problem statement
3. Brief example or expected output
4. 1-2 key requirements
5. 1 follow-up question

Keep the total length under 250 words and format with clear sections.`,
    slug: 'ai-mock-interview',
    buttonText: 'Start Interview',
    form: [
      {
        label: 'Role Level',
        name: 'role',
        field: 'select',
        options: [
          'Junior Developer',
          'Mid-Level Developer',
          'Senior Developer',
          'Tech Lead'
        ],
        required: true
      },
      {
        label: 'Topic Focus',
        name: 'topic',
        field: 'select',
        options: [
          'Data Structures & Algorithms',
          'System Design',
          'JavaScript/TypeScript',
          'React/Next.js',
          'Node.js',
          'Python',
          'DevOps & CI/CD',
          'Database Design'
        ],
        required: true
      },
      {
        label: 'Years of Experience',
        name: 'experience',
        field: 'select',
        options: [
          '0-2',
          '3-5',
          '5-8',
          '8+'
        ],
        required: true
      }
    ]
  }
];
