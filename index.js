const { promises: fs } = require('fs');
const readme = require('./readme');
const puppeteer = require('puppeteer');
const path = require('path');

const msInOneDay = 1000 * 60 * 60 * 24;

const today = new Date();
let dataCG = null;

function generateNewHTML(content) {
  const contentRow = content.split('\n');

  function updateIdentifier(identifier, replaceText) {
    const identifierIndex = findIdentifierIndex(contentRow, identifier);
    if (!contentRow[identifierIndex]) return;
    contentRow[identifierIndex] = contentRow[identifierIndex].replace(
      `<#${identifier}>`,
      replaceText
    );
  };

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

  return contentRow.join('\n');
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

async function htmlToImage(htmlString, outputPath) {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(htmlString, { waitUntil: 'networkidle0' });

  const element = await page.$('body > div');
  const boundingBox = await element.boundingBox();

  await page.setViewport({
      width: Math.ceil(boundingBox.width),
      height: Math.ceil(boundingBox.height),
      deviceScaleFactor: 1,
  });

  await element.screenshot({ path: outputPath });
  await browser.close();
}

let htmlCodingame = `
<div style="display: flex; justify-content: space-around; font-family: Courier;">
  <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; text-align: center; width: 45%;">
    <h2>PROGRESSION</h2>
    <div style="font-size: 48px; margin: 20px 0;">🥇</div>
    <h3 style="color: <#topColor>;">Level <#level></h3>
    <p><#tagline></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; text-align: center; width: 45%;">
    <h2>RANKING</h2>
    <div style="font-size: 48px; margin: 20px 0;">🏆</div>
    <h3 style="color: <#topColor2>;"><#topNumber><br><span style="font-size: 16px;">(top <#topPercentage>%)</span></h3>
    <p><#CGTitle></p>
    <div style="height: 10px; background: #eee; border-radius: 5px; overflow: hidden;">
      <div style="width: <#topSlider>%; height: 100%; background: <#topColor3>;"></div>
    </div>
  </div>
</div>
`;

const outputPath = path.join(__dirname, 'images/cg.png');


const findIdentifierIndex = (rows, identifier) =>
  rows.findIndex((r) => Boolean(r.match(new RegExp(`<#${identifier}>`, 'i'))));

const updateREADMEFile = (text) => fs.writeFile('./README.md', text);

async function main() {
  dataCG = await getDataCodingame();
  await htmlToImage(generateNewHTML(htmlCodingame), outputPath);
  const newREADME = generateNewHTML(readme);
  console.log(newREADME);
  updateREADMEFile(newREADME);
}

main();