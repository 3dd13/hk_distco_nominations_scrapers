const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');

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

const toCandidate = (englishDataCells, chineseDataCells, currentLength) => {
  return {
    candidateNumber: currentLength + 1,
    nameZh: chineseDataCells[2],
    nameEn: englishDataCells[2],
    receivedVotes: 0,
    elected: false,
    gender: englishDataCells[4] == 'M' ? 'male' : 'female',
    occupationEn: englishDataCells[5].trim(),
    occupationZh: chineseDataCells[5].trim(),
    policticalAffiliationEn: englishDataCells[6].trim(),
    policticalAffiliationZh: chineseDataCells[6].trim()
  }
}

function scrapeDistricts() {
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

      if (englishDataCells[0].trim() == '') {
        continue;
      }

      let constituency = _.find(constituenciesWithinDistrict, (constituency) => constituency.constituencyCode == englishDataCells[0]);
      if (!constituency) {
        constituency = {
          nameEn: englishDataCells[1],
          nameZh: chineseDataCells[1],
          districtNameEn: districtParam.nameEn,
          districtNameZh: districtParam.nameZh,
          constituencyType: 'district',
          constituencyCode: englishDataCells[0],
          autoDulyElected: false,
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

      const candidate = toCandidate(englishDataCells, chineseDataCells, constituency.candidates.length);
      if (englishDataCells[8].toLowerCase().startsWith('withdrawn')) {
        candidate.reasonOfNotValidlyNominated = '退選';
        delete candidate.candidateNumber;
        delete candidate.receivedVotes;
        delete candidate.elected;
        constituency.otherNominations.push(candidate);

      } else {
        constituency.candidates.push(candidate);
      }
    }

    return constituenciesWithinDistrict;
  });
}

Promise.all(scrapeDistricts()).then((constituencies) => {
  console.log(JSON.stringify(_.flatten(constituencies), null, 2));
})