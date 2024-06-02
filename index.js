const { promises: fs } = require('fs');
const readme = require('./readme');

const msInOneDay = 1000 * 60 * 60 * 24;

const today = new Date();

async function generateNewREADME() {
  const readmeRow = readme.split('\n');

  function updateIdentifier(identifier, replaceText) {
    const identifierIndex = findIdentifierIndex(readmeRow, identifier);
    if (!readmeRow[identifierIndex]) return;
    readmeRow[identifierIndex] = readmeRow[identifierIndex].replace(
      `<#${identifier}>`,
      replaceText
    );
  };

  let dataCG = await getDataCodingame();

  const identifierToUpdate = {
    // Add custom rows here
    // Format: identifier: func
    today_date: getTodayDate(),
    signing: getSigning(),
    special_day: getSpecialDay(),
    topColor: dataCG.topColor,
    topColor2: dataCG.topColor,
    topColor3: dataCG.topColor,
    level: dataCG.codingamer.level,
    topNumber: dataCG.rank,
    topPercentage: dataCG.topPercentage,
    topSlider: dataCG.topSlider,
    tagline: dataCG.codingamer.tagline??'',
    CGTitle: dataCG.CGTitle,
  };

  Object.entries(identifierToUpdate).forEach(([key, value]) => {
    updateIdentifier(key, value);
  });

  return readmeRow.join('\n');
}

const moodByDay = {
  0: "Kicking off the week with some code. 🚀",
  1: "Turning caffeine into code since 2019. ☕💻",
  2: "Commander of keystrokes, architect of solutions. ⌨️🏗️",
  3: "Debugging the matrix... one bug at a time. 🐛",
  4: "Dancing with algorithms in the rhythm of innovation. 💃🕺📈",
  5: "Exploring the binary jungle and making it user-friendly. 🌐🌿",
  6: "Code poet with a dash of caffeine. 📜☕",
  7: "Coding my way through the digital wilderness. 🌐",
};

function getSigning() {
  return moodByDay[today.getDay()];
}

function getTodayDate() {
  return today.toDateString();
}

const allSpecialDays = [
  {
    date: new Date(String(today.getFullYear())+ '-03-04'),
    text: '🎂 Happy birthday to me! 🎂',
  },
  {
    date: new Date(String(today.getFullYear())+ '-12-25'),
    text: '🎄 Merry Christmas! 🎄',
  },
  {
    date: new Date(String(today.getFullYear())+ '-01-01'),
    text: '🎉 Happy new year! 🎉',
  },
  {
    date: new Date(String(today.getFullYear())+ '-10-31'),
    text: '🎃 Happy Halloween! 🎃',
  },
  {
    date: new Date(String(today.getFullYear())+ '-02-14'),
    text: '🎉 Happy Valentine\'s Day! 🎉',
  },
  {
    date: new Date(String(today.getFullYear())+ '-03-17'),
    text: '🎉 Happy St. Patrick\'s Day! 🎉',
  },
  {
    date: new Date(String(today.getFullYear())+ '-04-22'),
    text: '🎉 Happy Earth Day! 🎉',
  },
  {
    date: new Date(String(today.getFullYear())+ '-04-01'),
    text: '🎉 Happy April Fools\' Day! 🎉',
  },
  {
    date: new Date(String(today.getFullYear())+ '-05-26'),
    text: '🎉 Happy Mother\'s Day! 🎉',
  },
  {
    date: new Date(String(today.getFullYear())+ '-06-16'),
    text: '🎉 Happy Father\'s Day! 🎉',
  },
]

function getSpecialDay() {
  const specialDay = allSpecialDays.find((specialDay) => {
    return specialDay.date.getDate() === today.getDate() &&
      specialDay.date.getMonth() === today.getMonth();
  });

  return specialDay ? "\n"+specialDay.text+"\n" : '';
}

async function getDataCodingame() {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const raw = JSON.stringify([
    "5188bb237cbb02e049ab6edb8fc18d8b1763755"
  ]);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  let data = await fetch("https://www.codingame.com/services/CodinGamer/findCodingamePointsStatsByHandle", requestOptions)
    .then((response) => response.json())
    .catch((error) => console.error(error));
  if (!data) return;
  const infoCG = getInfoCGStage(data.codingamer.rank);
  data.topColor = infoCG["color"];
  data.topPercentage = roundFirstDecimalNonZero(data.codingamer.rank/data.codingamePointsRankingDto.numberCodingamersGlobal);
  let stage = infoCG["stage"];
  data.topSlider = Math.round(100-(data.codingamer.rank-stage[0])/(stage[1]-stage[0])*100);
  data.rank = ordinal_suffix_of(data.codingamer.rank);
  data.CGTitle = infoCG["title"];
  return data;
}

const getInfoCGStage = (rank) => {
  if (rank > 5000){
    return {
      title: "Disciple",
      color: "green",
      stage: [5000, 10000]
    }
  }else if (rank > 2500){
    return {
      title: "Mentor",
      color: "brown",
      stage: [2500, 5000]
    }
  } else if (rank > 500){
    return {
      title: "Master",
      color: "grey",
      stage: [500, 2500]
    }
  } else if (rank > 100){
    return {
      title: "Grand Master",
      color: "orange",
      stage: [100, 500]
    }
  } else if (rank < 100){
    return {
      title: "Gourou",
      color: "red",
      stage: [0, 100]
    }
  }
}

function ordinal_suffix_of(i) {
  let j = i % 10,
      k = i % 100;
  if (j === 1 && k !== 11) {
      return i + "st";
  }
  if (j === 2 && k !== 12) {
      return i + "nd";
  }
  if (j === 3 && k !== 13) {
      return i + "rd";
  }
  return i + "th";
}

function roundFirstDecimalNonZero(number) {
  let numberStr = number.toString();

  let positionComma = numberStr.indexOf('.');
  if (positionComma === -1) {
      return number;
  }
  let i = positionComma + 1;
  while (i < numberStr.length && numberStr[i] === '0') {
      i++;
  }
  let numberDecimals = i - positionComma;

  let factor = Math.pow(10, numberDecimals);
  return Math.round(number * factor) / factor;
}


const findIdentifierIndex = (rows, identifier) =>
  rows.findIndex((r) => Boolean(r.match(new RegExp(`<#${identifier}>`, 'i'))));

const updateREADMEFile = (text) => fs.writeFile('./README.md', text);

async function main() {
  const newREADME = await generateNewREADME();
  console.log(newREADME);
  updateREADMEFile(newREADME);
}

main();