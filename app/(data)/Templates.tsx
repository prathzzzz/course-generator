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
  }
];
