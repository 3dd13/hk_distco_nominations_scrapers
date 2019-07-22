const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');

const url = "https://www.voterregistration.gov.hk/chi/statistic20183.html";
const englishUrl = url.replace('/chi/', '/eng/');

(async () => {
  const functionalStatisticsEnglishPageResponse = await axios.get(englishUrl);
  const functionalStatisticsChinesePageResponse = await axios.get(url);

  const $englishPage = cheerio.load(functionalStatisticsEnglishPageResponse.data)
  const englishPageDataRows = $englishPage('table > tbody > tr.content').slice(2);

  const $chinesePage = cheerio.load(functionalStatisticsChinesePageResponse.data)
  const chinesePageDataRows = $chinesePage('table > tbody > tr.contents').slice(2);

  const functionalStatistics = []
  for (let i = 0; i < englishPageDataRows.length; i++) {
    const englishDataRow = englishPageDataRows[i];
    const englishDataCells = $englishPage(englishDataRow).find('td').map((_index, cell) => $englishPage(cell).text()).get();

    const chineseDataRow = chinesePageDataRows[i];
    const chineseDataCells = $chinesePage(chineseDataRow).find('td').map((_index, cell) => $chinesePage(cell).text()).get();

    functionalStatistics.push(
      {
        nameEn: englishDataCells[1].trim(),
        nameZh: chineseDataCells[1].trim(),
        groupCount: parseInt(englishDataCells[2].replace(/,/, '').trim()) || 0,
        individualCount: parseInt(englishDataCells[3].replace(/,/, '').trim()) || 0
      }
    )
  }

  console.log('functionalStatistics', JSON.stringify(functionalStatistics, null, 2))
})();