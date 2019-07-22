const fs = require('fs');
const PDFParser = require("pdf2json");
const _ = require('lodash');

// const sourceFilePath = './data/input/legco_geographic_vote_registration/2013PR_Age&Sex_LC_c.pdf';
// const sourceFilePath = './data/input/legco_geographic_vote_registration/2015_lc_age_sex_c.pdf';
const sourceFilePath = './data/input/legco_geographic_vote_registration/2016PR_sex and age_LC_c.pdf';
const ageRanges = [
  "18_20",
  "21_25",
  "26_30",
  "31_35",
  "36_40",
  "41_45",
  "46_50",
  "51_55",
  "56_60",
  "61_65",
  "66_70",
  "71_"
];
const result = [
  {
    nameEn: "Hong Kong Island",
    nameZh: "香港島",
    count: null,
    byGenderAndAgeRange: [
      {
        gender: "male",
        count: null,
        byAgeRange: []
      },
      {
        gender: "female",
        count: null,
        byAgeRange: []
      }
    ]
  },
  {
    nameEn: "Kowloon West",
    nameZh: "九龍西",
    count: null,
    byGenderAndAgeRange: [
      {
        gender: "male",
        count: null,
        byAgeRange: []
      },
      {
        gender: "female",
        count: null,
        byAgeRange: []
      }
    ]
  },
  {
    nameEn: "Kowloon East",
    nameZh: "九龍東",
    count: null,
    byGenderAndAgeRange: [
      {
        gender: "male",
        count: null,
        byAgeRange: []
      },
      {
        gender: "female",
        count: null,
        byAgeRange: []
      }
    ]
  },
  {
    nameEn: "New Territories West",
    nameZh: "新界西",
    count: null,
    byGenderAndAgeRange: [
      {
        gender: "male",
        count: null,
        byAgeRange: []
      },
      {
        gender: "female",
        count: null,
        byAgeRange: []
      }
    ]
  },
  {
    nameEn: "New Territories East",
    nameZh: "新界東",
    count: null,
    byGenderAndAgeRange: [
      {
        gender: "male",
        count: null,
        byAgeRange: []
      },
      {
        gender: "female",
        count: null,
        byAgeRange: []
      }
    ]
  }
];

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

function convertTextRowsToGeographics(textRows) {
  for (let i = 0; i < textRows.length; i++) {
    const textRow = textRows[i];

    if (textRow.startsWith('男')) {
      const dataRow = textRows[i + 1];
      const cells = dataRow.split(',')
      for (let j = 0; j < 5; j++) {
        const byGenderAndAgeRange = _.find(result[j].byGenderAndAgeRange, { gender: 'male' })
        if (byGenderAndAgeRange.byAgeRange.length < ageRanges.length) {
          byGenderAndAgeRange.byAgeRange.push({
            ageRange: ageRanges[byGenderAndAgeRange.byAgeRange.length],
            count: parseInt(cells[j])
          });
        }
      }
    } else if (textRow.startsWith('女')) {
      const dataRow = textRows[i + 1];
      const cells = dataRow.split(',')
      for (let j = 0; j < 5; j++) {
        const byGenderAndAgeRange = _.find(result[j].byGenderAndAgeRange, { gender: 'female' })
        if (byGenderAndAgeRange.byAgeRange.length < ageRanges.length) {
          byGenderAndAgeRange.byAgeRange.push({
            ageRange: ageRanges[byGenderAndAgeRange.byAgeRange.length],
            count: parseInt(cells[j])
          });
        }
      }
    }
  }
}

const pdfParser = new PDFParser();
pdfParser.on("pdfParser_dataError", (errData) => console.error("error", errData.parserError) );
pdfParser.on("pdfParser_dataReady", (pdfData) => {
  const textRows = convertPdfDataToText(pdfData.formImage.Pages);
  convertTextRowsToGeographics(textRows);

  _.each(result, (geographicItem) => {
    _.each(geographicItem.byGenderAndAgeRange, (byGenderItem) => {
      byGenderItem.count = _.sumBy(byGenderItem.byAgeRange, 'count')
    });

    geographicItem.count = _.sumBy(geographicItem.byGenderAndAgeRange, (byGenderItem) => byGenderItem.count);
  });

  console.log(JSON.stringify(result, null, 2));
});
pdfParser.loadPDF(sourceFilePath);