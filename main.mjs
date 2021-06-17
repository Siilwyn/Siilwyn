import { promises as fs } from 'fs';
import https from 'https';

const repositoryToListItem = (repository) => (
  `* [${repository.name}](${repository.url}) <br/> <sub>${repository.description}</sub>`
);

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
${parsedData.javascript.map(repositoryToListItem).join('\n')}

</td>
<td valign="top" width="50%">

### Rust :crab:
${parsedData.rust.map(repositoryToListItem).join('\n')}

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
      starredRepositories {
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
