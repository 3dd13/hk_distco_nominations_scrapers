const fs = require('fs');
const PDFParser = require("pdf2json");
const _ = require('lodash');

const districtParams = [
  {
    districtNameEn: "Central & Western District",
    districtNameZh: "中西區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_A.pdf"
  },
  {
    districtNameEn: "Wan Chai District",
    districtNameZh: "灣仔區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_B.pdf"
  },
  {
    districtNameEn: "Eastern District",
    districtNameZh: "東區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_C.pdf"
  },
  {
    districtNameEn: "Southern District",
    districtNameZh: "南區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_D.pdf"
  },
  {
    districtNameEn: "Yau Tsim Mong District",
    districtNameZh: "油尖旺區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_E.pdf"
  },
  {
    districtNameEn: "Sham Shui Po District",
    districtNameZh: "深水埗區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_F.pdf"
  },
  {
    districtNameEn: "Kowloon City District",
    districtNameZh: "九龍城區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_G.pdf"
  },
  {
    districtNameEn: "Wong Tai Sin District",
    districtNameZh: "黃大仙區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_H.pdf"
  },
  {
    districtNameEn: "Kwun Tong District",
    districtNameZh: "觀塘區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_J.pdf"
  },
  {
    districtNameEn: "Tsuen Wan District",
    districtNameZh: "荃灣區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_K.pdf"
  },
  {
    districtNameEn: "Tuen Mun District",
    districtNameZh: "屯門區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_L.pdf"
  },
  {
    districtNameEn: "Yuen Long District",
    districtNameZh: "元朗區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_M.pdf"
  },
  {
    districtNameEn: "North District",
    districtNameZh: "北區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_N.pdf"
  },
  {
    districtNameEn: "Tai Po District",
    districtNameZh: "大埔區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_P.pdf"
  },
  {
    districtNameEn: "Sai Kung District",
    districtNameZh: "西貢區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_Q.pdf"
  },
  {
    districtNameEn: "Sha Tin District",
    districtNameZh: "沙田區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_R.pdf"
  },
  {
    districtNameEn: "Kwai Tsing District",
    districtNameZh: "葵青區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_S.pdf"
  },
  {
    districtNameEn: "Islands District",
    districtNameZh: "離島區",
    url: "./data/input/2018_distco_constituencies_voter_registration/2018PR_T.pdf"
  }
];

function toGenderCounts(gender, countRow) {
  const countTotal = _.sum(countRow.slice(0, 12))
  return {
    gender,
    count: countTotal,
    byAgeRange: [
      {
        ageRange: "18_20",
        count: countRow[0]
      },
      {
        ageRange: "21_25",
        count: countRow[1]
      },
      {
        ageRange: "26_30",
        count: countRow[2]
      },
      {
        ageRange: "31_35",
        count: countRow[3]
      },
      {
        ageRange: "36_40",
        count: countRow[4]
      },
      {
        ageRange: "41_45",
        count: countRow[5]
      },
      {
        ageRange: "46_50",
        count: countRow[6]
      },
      {
        ageRange: "51_55",
        count: countRow[7]
      },
      {
        ageRange: "56_60",
        count: countRow[8]
      },
      {
        ageRange: "61_65",
        count: countRow[9]
      },
      {
        ageRange: "66_70",
        count: countRow[10]
      },
      {
        ageRange: "71_",
        count: countRow[11]
      }
    ]
  };
}

function convertPdfDataToText(pages) {
  return _.flatMap(pages, (page) => {
    const groupedByPosY = _.groupBy(page.Texts, (text) => text.y);
    const sortedAndGroupedByPosY = _.sortBy(groupedByPosY, (item, posY) => posY);
    const textLineGroupedByPosY = _.map(sortedAndGroupedByPosY, (textGroup, posY) => {
      const sortedtextGroup = _.sortBy(textGroup, (text) => text.x);
      const value = _.map(sortedtextGroup, (text) => decodeURI(text.R[0].T).replace('%2C', '')).join(',')
      return value;
    })
    return textLineGroupedByPosY;
  });
}

function convertTextRowsToConstituency(textRows, codePrefix) {
  const byConstituency = [];

  for (let i = 0; i < textRows.length; i++) {
    const currentRow = textRows[i].split(',');

    if (currentRow.length = 1 && currentRow[0] == 'Female') {
      const code = byConstituency.length + 1
      const maleCounts = toGenderCounts("male", _.map(textRows[i - 3].split(','), (cell) => parseInt(cell)));
      const femaleCounts = toGenderCounts("female", _.map(textRows[i + 1].split(','), (cell) => parseInt(cell)));

      const constituency = {
        nameEn: textRows[i - 2],
        nameZh: textRows[i - 6],
        constituencyCode: `${codePrefix}${code.toString().padStart(2, '0')}`,
        count: maleCounts.count + femaleCounts.count,
        byGenderAndAgeRange: [
          maleCounts,
          femaleCounts
        ]
      }

      byConstituency.push(constituency)
    }
  }

  return byConstituency;
}

const byDistcoDistrict = [];

for (let k = 0; k < districtParams.length; k++) {
  const districtParam = districtParams[k];
  const codePrefix = districtParam.url[districtParam.url.length - 5];

  const pdfParser = new PDFParser();
  pdfParser.on("pdfParser_dataError", (errData) => console.error("error", errData.parserError) );
  pdfParser.on("pdfParser_dataReady", (pdfData) => {
    const textRows = convertPdfDataToText(pdfData.formImage.Pages);
    const constituencies = convertTextRowsToConstituency(textRows, codePrefix);

    byDistcoDistrict.push({
      nameEn: districtParam.districtNameEn,
      nameZh: districtParam.districtNameZh,
      count: _.sumBy(constituencies, 'count'),
      byConstituency: constituencies
    })

    if (byDistcoDistrict.length == 18) {
      console.log(JSON.stringify(byDistcoDistrict, null, 2));
    }
  });
  pdfParser.loadPDF(districtParam.url);
}
