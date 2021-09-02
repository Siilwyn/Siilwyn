import { promises as fs } from 'fs';
import https from 'https';

const repositoryToListItem = (repository) => (
  `* [${repository.name}](${repository.url}) <br/> <sub>${repository.description}</sub>`
);

const repositoriesToList = (repositories) => {
  const [newestRepositories, olderRepositories] = [
    repositories.slice(0, 7).map(repositoryToListItem),
    repositories.slice(7).map(repositoryToListItem),
  ];

  return `
${newestRepositories.join('\n')}
${olderRepositories.length
  ? `
<details>
<summary>Show older stars</summary>

${olderRepositories.join('\n')}

</details>
` : '' }
`;
};

const request = https.request(
  'https://api.github.com/graphql',
  {
    method: 'POST',
    headers: {
      'User-Agent': 'Siilwyn readme stars fetcher',
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  },
  (response) => {
    let responseData = '';

    response.on('data', (chunk) => responseData += chunk);

    response.on('end', () => {
      const { data } = JSON.parse(responseData);

      const parsedData = {
        javascript: data.user.starredRepositories.nodes.filter(
          (repository) => (
            repository.primaryLanguage.name === 'JavaScript'
            || repository.primaryLanguage.name === 'TypeScript'
          )
        ),
        rust: data.user.starredRepositories.nodes.filter(
          (repository) => repository.primaryLanguage.name === 'Rust'
        )
      };

      fs.writeFile('./readme.md', `## Packages & crates I enjoy using

*[Automatically generated](https://github.com/Siilwyn/Siilwyn) from my stars.*

<table width="100%">
<tr>
<td valign="top" width="50%">

### JavaScript :turtle:
${repositoriesToList(parsedData.javascript)}

</td>
<td valign="top" width="50%">

### Rust :crab:
${repositoriesToList(parsedData.rust)}

</td>
</tr>
</table>
`)
    });
  }
);

request.end(JSON.stringify({
  query: `{
    user(login: "Siilwyn") {
      id
      starredRepositories(orderBy: {field: STARRED_AT, direction: DESC}) {
        nodes {
          name
          description
          url
          primaryLanguage {
            name
          }
        }
      }
    }
  }
`}));
