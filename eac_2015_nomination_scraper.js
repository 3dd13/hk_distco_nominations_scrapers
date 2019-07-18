const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');

const uncontestedUrl = 'https://www.elections.gov.hk/dc2015/pdf/2015_DCE_Uncontested_C.html';

const districtParams = [
  {
    nameEn: 'Central & Western District',
    nameZh: '中西區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/CentralandWestern_20151015_c.html',
  },
  {
    nameEn: 'Wan Chai District',
    nameZh: '灣仔區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/Wanchai_20151015_c.html',
  },
  {
    nameEn: 'Eastern District',
    nameZh: '東區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/Eastern_20151015_c.html',

  },
  {
    nameEn: 'Southern District',
    nameZh: '南區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/Southern_20151015_c.html',
  },

  {
    nameEn: 'Yau Tsim Mong District',
    nameZh: '油尖旺區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/YauTsimMong_20151015_c.html',
  },
  {
    nameEn: 'Sham Shui Po District',
    nameZh: '深水埗區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/ShamShuiPo_20151015_c.html',
  },
  {
    nameEn: 'Kowloon City District',
    nameZh: '九龍城區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/KowloonCity_20151015_c.html',
  },
  {
    nameEn: 'Wong Tai Sin District',
    nameZh: '黃大仙區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/WongTaiSin_20151015_c.html',
  },
  {
    nameEn: 'Kwun Tong District',
    nameZh: '觀塘區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/KwunTong_20151015_c.html',
  },

  {
    nameEn: 'Tsuen Wan District',
    nameZh: '荃灣區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/TsuenWan_20151015_c.html',
  },
  {
    nameEn: 'Tuen Mun District',
    nameZh: '屯門區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/TuenMun_20151015_c.html',
  },
  {
    nameEn: 'Yuen Long District',
    nameZh: '元朗區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/YuenLong_20151015_c.html',
  },
  {
    nameEn: 'North District',
    nameZh: '北區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/North_20151015_c.html',
  },
  {
    nameEn: 'Tai Po District',
    nameZh: '大埔區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/TaiPo_20151015_c.html',
  },
  {
    nameEn: 'Sai Kung District',
    nameZh: '西貢區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/SaiKung_20151015_c.html',
  },
  {
    nameEn: 'Sha Tin District',
    nameZh: '沙田區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/ShaTin_20151015_c.html',
  },
  {
    nameEn: 'Kwai Tsing District',
    nameZh: '葵青區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/KwaiTsing_20151015_c.html',
  },
  {
    nameEn: 'Islands District',
    nameZh: '離島區',
    url: 'https://www.elections.gov.hk/dc2015/pdf/nomination/Islands_20151015_c.html'
  }
];

const getEnglishUrl = (url) => url.replace('_c.html', '_e.html');

const toCandidate = (englishDataCells, chineseDataCells, isUncontestedConstituency, voteResultConstituency) => {
  const nameEn = englishDataCells[2].replace(/-/g, ' ');
  const matchedVoteResultCandidate = _.find(voteResultConstituency.candidates, (candidate) => { return (candidate.nameEn.toLowerCase() == nameEn.toLowerCase()); });
  let reasonOfNotValidlyNominated = null;

  if (!matchedVoteResultCandidate) {
    if (englishDataCells[8].toLowerCase().startsWith('withdrawn')) {
      reasonOfNotValidlyNominated = "退選";
    } else {
      reasonOfNotValidlyNominated = "無效";
    }
  }

  return {
    candidateNumber: matchedVoteResultCandidate ? matchedVoteResultCandidate.candidateNumber : -1,
    nameZh: chineseDataCells[2],
    nameEn: nameEn,
    receivedVotes: matchedVoteResultCandidate ? matchedVoteResultCandidate.receivedVotes : 0,
    elected: isUncontestedConstituency || matchedVoteResultCandidate && matchedVoteResultCandidate.elected,
    gender: englishDataCells[4] == 'M' ? 'male' : 'female',
    occupationEn: englishDataCells[5].trim(),
    occupationZh: chineseDataCells[5].trim(),
    policticalAffiliationEn: englishDataCells[6].trim(),
    policticalAffiliationZh: chineseDataCells[6].trim(),
    reasonOfNotValidlyNominated: reasonOfNotValidlyNominated
  };
};

function scrapeDistricts(uncontestedConstituencies, voteResultConstituencies) {
  return _.map(districtParams, async (districtParam) => {
    const norminationEnglishPageResponse = await axios.get(getEnglishUrl(districtParam.url));
    const $englishPage = cheerio.load(norminationEnglishPageResponse.data)
    const englishPageDataRows = $englishPage('table > tbody > tr').slice(1);

    const norminationChinesePageResponse = await axios.get(districtParam.url);
    const $chinesePage = cheerio.load(norminationChinesePageResponse.data)
    const chinesePageDataRows = $chinesePage('table > tbody > tr').slice(1);

    const constituenciesWithinDistrict = []
    for (let i = 0; i < englishPageDataRows.length; i++) {
      const englishDataRow = englishPageDataRows[i];
      const englishDataCells = $englishPage(englishDataRow).find('td').map((_index, cell) => $englishPage(cell).text()).get();

      const chineseDataRow = chinesePageDataRows[i];
      const chineseDataCells = $chinesePage(chineseDataRow).find('td').map((_index, cell) => $chinesePage(cell).text()).get();
      const constituencyCode = englishDataCells[0];

      if (constituencyCode.trim() == '') {
        continue;
      }

      const voteResultConstituency = _.find(voteResultConstituencies, (voteResultConstituency) => voteResultConstituency.constituencyCode == constituencyCode);
      let constituency = _.find(constituenciesWithinDistrict, (constituency) => constituency.constituencyCode == constituencyCode);
      const uncontestedConstituency = _.find(uncontestedConstituencies, (uncontestedConstituency) => uncontestedConstituency.constituencyCode == constituencyCode);
      const isUncontestedConstituency = !!uncontestedConstituency;
      if (!constituency) {
        constituency = {
          nameEn: englishDataCells[1],
          nameZh: chineseDataCells[1],
          districtNameEn: districtParam.nameEn,
          districtNameZh: districtParam.nameZh,
          constituencyType: 'district',
          constituencyCode: constituencyCode,
          uncontestedConstituency: isUncontestedConstituency,
          availableVotes: 0,
          submittedVotes: 0,
          voidedVotes: 0,
          voteSubmissionPercentage: 0,
          accumulatedVotesByHour: [],
          candidates: [],
          otherNominations: []
        };
        constituenciesWithinDistrict.push(constituency);
      }

      const candidate = toCandidate(englishDataCells, chineseDataCells, isUncontestedConstituency, voteResultConstituency);
      if (candidate.reasonOfNotValidlyNominated) {
        delete candidate.candidateNumber;
        delete candidate.receivedVotes;
        delete candidate.elected;
        constituency.otherNominations.push(candidate);
      } else {
        delete candidate.reasonOfNotValidlyNominated;
        constituency.candidates.push(candidate);
      }
    }

    return constituenciesWithinDistrict;
  });
}

async function getUncontestedConstituencies() {
  const uncontestedConstituenciesPageResponse = await axios.get(uncontestedUrl);
  const $uncontestedConstituenciesPage = cheerio.load(uncontestedConstituenciesPageResponse.data);
  const uncontestedConstituenciesPageDataRows = $uncontestedConstituenciesPage('table > tbody > tr').slice(1);

  return _.map(uncontestedConstituenciesPageDataRows, (uncontestedConstituenciesPageDataRow) => {
    const cells = $uncontestedConstituenciesPage(uncontestedConstituenciesPageDataRow).find('td');

    const cellTexts = _.map(cells, (cell, _index) => {
      return $uncontestedConstituenciesPage(cell).text();
    });

    return {
      constituencyCode: cellTexts[1],
      name: cellTexts[3]
    };
  });
}

function getVoteResultConstituencies() {
  const voteResultFileContent = fs.readFileSync('2015_result.txt', 'utf8');
  const contentLines = voteResultFileContent.split('\n');
  const constituencies = [];
  let currentConstituency = null;
  let matchResult;
  for (let i = 0; i < contentLines.length; i++) {
    currentLine = contentLines[i].trim();

    if (matchResult = currentLine.match(/^(\w\d\d)\s/i)) {
      if (currentConstituency) {
        constituencies.push(currentConstituency)
      }
      currentConstituency = {
        constituencyCode: matchResult[1],
        candidates: []
      }
    } else if (matchResult = currentLine.match(/^([\w\s]*)\s-\sUncontested$/i)) {
      currentConstituency.candidates.push({
        candidateNumber: -1,
        nameEn: matchResult[1],
        receivedVotes: 0,
        elected: true
      })
    } else if (matchResult = currentLine.match(/^(\d)\s([A-Z\s]*)\s(\d*)(\sElected)?/i)) {
      currentConstituency.candidates.push({
        candidateNumber: parseInt(matchResult[1]),
        nameEn: matchResult[2],
        receivedVotes: parseInt(matchResult[3]),
        elected: !!matchResult[4]
      })
    }
  }
  constituencies.push(currentConstituency)

  return constituencies;
}

const voteResultConstituencies = getVoteResultConstituencies();

getUncontestedConstituencies().then((uncontestedConstituencies) => {
  Promise.all(scrapeDistricts(uncontestedConstituencies, voteResultConstituencies)).then((constituencies) => {
    console.log(JSON.stringify(_.flatten(constituencies), null, 2));
  })
})
