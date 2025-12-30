const fs = require('fs');
const https = require('https');

const query = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        acRate
        difficulty
        freqBar
        frontendQuestionId: questionFrontendId
        isFavor
        paidOnly: isPaidOnly
        status
        title
        titleSlug
        topicTags {
          name
          id
          slug
        }
        hasSolution
        hasVideoSolution
      }
    }
  }
`;

const variables = {
  categorySlug: "",
  skip: 0,
  limit: 5000, // Fetch all problems (approx 3800+)
  filters: {}
};

const postData = JSON.stringify({
  query: query,
  variables: variables
});

const options = {
  hostname: 'leetcode.com',
  port: 443,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'Mozilla/5.0'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.data && json.data.problemsetQuestionList) {
        const problems = json.data.problemsetQuestionList.questions;
        fs.writeFileSync('public/problems.json', JSON.stringify(problems, null, 2));
        console.log(`Successfully saved ${problems.length} problems to public/problems.json`);
      } else {
        console.error('Failed to fetch problems:', json);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(postData);
req.end();
