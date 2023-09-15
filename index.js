const { promises: fs } = require('fs');
const readme = require('./readme');

const msInOneDay = 1000 * 60 * 60 * 24;

const today = new Date();

function generateNewREADME() {
  const readmeRow = readme.split('\n');

  function updateIdentifier(identifier, replaceText) {
    const identifierIndex = findIdentifierIndex(readmeRow, identifier);
    if (!readmeRow[identifierIndex]) return;
    readmeRow[identifierIndex] = readmeRow[identifierIndex].replace(
      `<#${identifier}>`,
      replaceText
    );
  }

  const identifierToUpdate = {
    //day_before_new_years: getDBNWSentence(),
    today_date: getTodayDate(),
    signing: getSigning(),
    special_day: getSpecialDay(),
  };

  Object.entries(identifierToUpdate).forEach(([key, value]) => {
    updateIdentifier(key, value);
  });

  return readmeRow.join('\n');
}

const moodByDay = {
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

function getDBNWSentence() {
  const nextYear = today.getFullYear() + 1;
  const nextYearDate = new Date(String(nextYear));

  const timeUntilNewYear = nextYearDate.getTime() - today.getTime();
  const dayUntilNewYear = Math.round(timeUntilNewYear / msInOneDay);

  return `**${dayUntilNewYear} day before ${nextYear} ⏱**`;
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


const findIdentifierIndex = (rows, identifier) =>
  rows.findIndex((r) => Boolean(r.match(new RegExp(`<#${identifier}>`, 'i'))));

const updateREADMEFile = (text) => fs.writeFile('./README.md', text);

function main() {
  const newREADME = generateNewREADME();
  console.log(newREADME);
  updateREADMEFile(newREADME);
}
main();
