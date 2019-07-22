const fs = require('fs');
const _ = require('lodash');

// hand crafted from https://www.voterregistration.gov.hk/chi/2018PR_sex%20and%20age_LC_c.pdf
const sourceFilePath = './data/input/2018_legco_geographic_voter_registration.txt';
const result = [
  {
    nameEn: "Hong Kong Island",
    nameZh: "香港島",
    count: 616732,
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
    count: 487160,
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
    count: 613183,
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
    count: 1102603,
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
    count: 994640,
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

function parseLegcoGeographicVoterRegistrations() {
  const voterRegistrationFileContent = fs.readFileSync(sourceFilePath, 'utf8');
  const contentLines = voterRegistrationFileContent.split('\n');

  for (let i = 0; i < contentLines.length; i++) {
    currentLine = contentLines[i].trim();
    const cells = currentLine.split(' ')

    for (let j = 0; j < 5; j++) {
      const matchedConstituency = _.find(result[j].byGenderAndAgeRange, { gender: cells[1] })
      matchedConstituency.byAgeRange.push({
        ageRange: cells[0],
        count: parseInt(cells[2 + j])
      });
    }
  }
}

function calculateCountByGender() {
  _.each(result, (constituency) => {
    _.each(constituency.byGenderAndAgeRange, (groupedByGender) => {
      groupedByGender.count = _.sumBy(groupedByGender.byAgeRange, 'count');
    })
  })
}

parseLegcoGeographicVoterRegistrations();
calculateCountByGender();
console.log(JSON.stringify(result, null, 2));