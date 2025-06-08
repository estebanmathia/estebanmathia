const { promises: fs } = require('fs');
const readme = require('./readme');
const puppeteer = require('puppeteer');
const path = require('path');

// API Key for Abstract Public Holidays API.
// For production, consider using environment variables: e.g., process.env.ABSTRACT_HOLIDAYS_API_KEY
const ABSTRACT_HOLIDAYS_API_KEY = '7d2663d8dc4847c9bbe1c06303bc6973';

// const msInOneDay = 1000 * 60 * 60 * 24; // Unused constant
const today = new Date();
let dataCG = null; // Holds the processed Codingame data once fetched.

/**
 * Populates an HTML template string with provided data.
 * It replaces placeholders like `<#key>` with corresponding values from the data object
 * and also injects dynamic content like date, signing message, and special day announcements.
 *
 * @param {string} templateString The HTML template string.
 * @param {object} data Object containing data to populate the template. Keys in this object will replace `<#key>` placeholders.
 * @returns {Promise<string>} A promise that resolves to the populated HTML string.
 */
async function populateHtmlTemplate(templateString, data) { // Made async
  let content = templateString;

  // Combine general placeholders with specific data from the 'data' object.
  // Specific data will override general placeholders if keys conflict (due to order of spread).
  const identifiers = {
    today_date: getTodayDate(),
    signing: getSigning(),
    special_day: await getSpecialDay(), // Await the async getSpecialDay
    ...data, // Spread operator to include all properties from the data object.
  };

  for (const [key, value] of Object.entries(identifiers)) {
    const regex = new RegExp(`<#${key}>`, 'gi'); // 'g' for global, 'i' for case-insensitive
    content = content.replace(regex, value ?? ''); // Replace with value or empty string if value is null/undefined (using ?? for stricter null/undefined check)
  }

  return content;
}

/**
 * Generates HTML content for the Codingame stats image by reading a template file
 * and populating it with Codingame data.
 *
 * @param {object} codingameData Processed data object from Codingame.
 * @returns {Promise<string>} A promise that resolves to the HTML string for the image, or an empty string if an error occurs.
 */
async function generateCodingameImageHtml(codingameData) {
  if (!codingameData) return ''; // Return empty string if no data

  let template;
  try {
    template = await fs.readFile(path.join(__dirname, 'codingame_template.html'), 'utf8');
  } catch (error) {
    console.error("Error reading HTML template file:", error);
    return ''; // Return empty string or handle error as appropriate
  }

  // Prepare data for the template, ensuring all placeholders are covered
  // These are specific keys expected by the codingame_template.html
  const templateData = {
    topColor: codingameData.topColor,
    topColor2: codingameData.topColor, // Assuming topColor2 is same as topColor
    topColor3: codingameData.topColor, // Assuming topColor3 is same as topColor
    level: codingameData.codingamer.level,
    tagline: codingameData.codingamer.tagline ?? '',
    topNumber: codingameData.rank,
    topPercentage: codingameData.topPercentage,
    CGTitle: codingameData.CGTitle,
    topSlider: codingameData.topSlider,
  };

  return populateHtmlTemplate(template, templateData);
}

// moodByDay, getSigning, getTodayDate, allSpecialDays, getSpecialDay,
// fetchCodingameData, processCodingameData, getInfoCGStage,
// ordinal_suffix_of, roundFirstDecimalNonZero, htmlToImage,
// are all utility or core logic functions, correctly placed.

// Static data for daily messages
const moodByDay = {
  0: "Kicking off the week with some code. 🚀", // Sunday
  1: "Turning caffeine into code since 2019. ☕💻", // Monday
  2: "Commander of keystrokes, architect of solutions. ⌨️🏗️", // Tuesday
  3: "Debugging the matrix... one bug at a time. 🐛", // Wednesday
  4: "Dancing with algorithms in the rhythm of innovation. 💃🕺📈", // Thursday
  5: "Exploring the binary jungle and making it user-friendly. 🌐🌿", // Friday
  6: "Code poet with a dash of caffeine. 📜☕" // Saturday
  // Removed duplicate and day 7 entries as Date.getDay() is 0-6
};

function getSigning() {
  return moodByDay[today.getDay()];
}

/**
 * Returns the current date as a formatted string.
 * @returns {string} The current date (e.g., "Mon Jan 01 2024").
 */
function getTodayDate() {
  return today.toDateString();
}

// Definitions for special day announcements
const allSpecialDays = [
  {
    date: new Date(String(today.getFullYear())+ '-03-04'), // Example: March 4th
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

/**
 * Asynchronously fetches daily holidays from an API and checks for manually defined special days.
 * It combines messages for all found holidays and special days.
 * @returns {Promise<string>} A promise that resolves to a string containing formatted messages for any holidays or special days,
 * or an empty string if none are found.
 */
async function getSpecialDay() {
  let messages = '';

  // Fetch holidays from API
  // Using 'US' as a default country code for now. This could be made configurable.
  const fetchedHolidays = await fetchDailyEvents(ABSTRACT_HOLIDAYS_API_KEY, 'US');
  if (fetchedHolidays && fetchedHolidays.length > 0) {
    for (const holidayName of fetchedHolidays) {
      messages += `\n🎉 Happy ${holidayName}! 🎉`; // Append formatted API holiday
    }
  }

  // Check for manually defined special days
  const manualSpecialDay = allSpecialDays.find((specialDay) => {
    return specialDay.date.getDate() === today.getDate() &&
      specialDay.date.getMonth() === today.getMonth();
  });

  if (manualSpecialDay) {
    // The manualSpecialDay.text is already formatted with leading/trailing newlines (e.g., "\n🎂 Happy birthday! 🎂\n")
    // The API holidays are formatted as "\n🎉 Happy Holiday! 🎉"
    // If 'messages' already contains API holidays, it will look like:
    // "\n🎉 Happy Holiday1! 🎉\n🎉 Happy Holiday2! 🎉"
    // Appending manualSpecialDay.text:
    // "\n🎉 Happy Holiday1! 🎉\n🎉 Happy Holiday2! 🎉\n🎂 Happy birthday! 🎂\n"
    // This formatting seems acceptable.
    messages += `${manualSpecialDay.text}`;
  }

  return messages;
}

/**
 * Fetches daily holiday events from the Abstract Public Holidays API for a given country and date.
 * @param {string} apiKey The API key for Abstract Public Holidays API.
 * @param {string} countryCode The country code (e.g., 'US', 'GB').
 * @returns {Promise<string[]>} A promise that resolves to an array of holiday names, or an empty array if an error occurs or no holidays are found.
 */
async function fetchDailyEvents(apiKey, countryCode) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, pad to MM
  const day = String(now.getDate()).padStart(2, '0'); // Pad to DD

  const apiUrl = `https://holidays.abstractapi.com/v1/?api_key=${apiKey}&country=${countryCode}&year=${year}&month=${month}&day=${day}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`Error fetching daily events: API request failed with status ${response.status} - ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    // The API returns an empty array if there are no holidays, which is a valid success response.
    if (Array.isArray(data) && data.length === 0) {
      return []; // No holidays today
    }

    // If data is an array and has items, map to holiday names.
    // Assuming the API returns an array of objects, each with a 'name' property.
    if (Array.isArray(data)) {
      return data.map(holiday => holiday.name).filter(name => name); // Filter out any potentially undefined names
    }

    // If the response is not an array (unexpected format), log it and return empty.
    console.error("Error fetching daily events: Unexpected API response format.", data);
    return [];

  } catch (error) {
    console.error("Error during fetchDailyEvents:", error);
    return [];
  }
}

/**
 * Fetches Codingame user statistics from the Codingame API.
 * @returns {Promise<object|null>} A promise that resolves to the JSON response from the API, or null if an error occurs.
 */
async function fetchCodingameData() {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  // The user handle is part of the request body for this specific API endpoint.
  const raw = JSON.stringify([
    "5188bb237cbb02e049ab6edb8fc18d8b1763755"
  ]);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  return fetch("https://www.codingame.com/services/CodinGamer/findCodingamePointsStatsByHandle", requestOptions)
    .then((response) => {
      if (!response.ok) {
        // Log more details for non-ok responses
        console.error(`API request failed with status ${response.status}: ${response.statusText}`);
        return null;
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error during fetchCodingameData:", error);
      return null;
    });
}

/**
 * Processes raw data from the Codingame API to calculate rank, percentages, and other display-specific values.
 * @param {object} data Raw data object from `fetchCodingameData`. Expected to have `codingamer.rank` and `codingamePointsRankingDto.numberCodingamersGlobal`.
 * @returns {object|null} An object with processed Codingame data, or null if input data is invalid or missing.
 */
function processCodingameData(data) {
  // Validate essential data structures before proceeding.
  if (!data || !data.codingamer || !data.codingamer.rank || !data.codingamePointsRankingDto || !data.codingamePointsRankingDto.numberCodingamersGlobal) {
    console.error("Invalid or incomplete data received for processing:", data);
    return null;
  }

  const infoCG = getInfoCGStage(data.codingamer.rank);
  const processedData = { ...data }; // Create a shallow copy to avoid mutating the original data.

  processedData.topColor = infoCG.color;
  processedData.topPercentage = roundFirstDecimalNonZero(
    data.codingamer.rank / data.codingamePointsRankingDto.numberCodingamersGlobal
  );
  const stage = infoCG.stage;
  // Calculate slider percentage: 100 - ( (current_rank - stage_start_rank) / (stage_end_rank - stage_start_rank) * 100 )
  // This represents how "far" into the current stage the rank is, inverted.
  processedData.topSlider = Math.round(
    100 - ((data.codingamer.rank - stage[0]) / (stage[1] - stage[0])) * 100
  );
  processedData.rank = ordinal_suffix_of(data.codingamer.rank); // Add ordinal suffix (e.g., 1st, 2nd)
  processedData.CGTitle = infoCG.title;
  return processedData;
}

/**
 * Determines the Codingame title, color, and rank stage based on the user's rank.
 * @param {number} rank The user's Codingame rank.
 * @returns {{title: string, color: string, stage: number[]}} An object containing the title, color, and rank stage [min_rank_in_stage, max_rank_in_stage].
 */
const getInfoCGStage = (rank) => {
  // Defines rank thresholds for different titles and visual styles.
  if (rank > 5000){
    return {
      title: "Disciple", // Title for this rank range
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
  } else if (rank <= 100){
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

/**
 * Rounds a number to its first non-zero decimal place.
 * E.g., 0.00234 becomes 0.002, 0.567 becomes 0.6.
 * If the number has no decimal part or no non-zero decimal, it's returned as is.
 * @param {number} number The number to round.
 * @returns {number} The rounded number.
 */
function roundFirstDecimalNonZero(number) {
  const numberStr = number.toString();
  const positionComma = numberStr.indexOf('.');

  // If no decimal point, or it's an integer, return as is.
  if (positionComma === -1) {
      return number;
  }

  let i = positionComma + 1;
  // Find the first non-zero decimal digit.
  while (i < numberStr.length && numberStr[i] === '0') {
      i++;
  }

  // If all decimal digits are zero (e.g., 2.000) or no non-zero decimal found.
  if (i === numberStr.length && numberStr[i-1] === '0') {
    return Math.round(number); // Return the integer part if decimals are all zero
  }

  // Number of decimal places to round to (up to the first non-zero one).
  const numberDecimals = i - positionComma;
  const factor = Math.pow(10, numberDecimals);
  return Math.round(number * factor) / factor;
}

/**
 * Converts an HTML string to an image using Puppeteer and saves it to the specified path.
 * @param {string} htmlString The HTML string to convert.
 * @param {string} outputPath The path where the image will be saved.
 * @returns {Promise<boolean>} A promise that resolves to true if image creation was successful, false otherwise.
 */
async function htmlToImage(htmlString, outputPath) {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox', // Disables sandbox, common for CI environments
        '--disable-setuid-sandbox' // Disables setuid sandbox (another common CI flag)
      ]
    });
    const page = await browser.newPage();

    await page.setContent(htmlString, { waitUntil: 'networkidle0' });

    const element = await page.$('body > div');
    if (!element) {
      console.error('Could not find element "body > div" for screenshot.');
      if (browser) await browser.close(); // Ensure browser is closed
      return false; // Indicate failure
    }
    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
      console.error('Could not get bounding box for element.');
      if (browser) await browser.close();
      return false; // Indicate failure
    }

    await page.setViewport({
        width: Math.ceil(boundingBox.width),
        height: Math.ceil(boundingBox.height),
        deviceScaleFactor: 1,
    });

    await element.screenshot({ path: outputPath });
    console.log(`Image successfully created at ${outputPath}`);
    return true; // Indicate success
  } catch (error) {
    console.error("Error in htmlToImage:", error);
    return false; // Indicate failure
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Note: The global htmlCodingame variable was removed as the template is now in codingame_template.html
// Note: The findIdentifierIndex function was removed as it's no longer used by populateHtmlTemplate.

const outputPath = path.join(__dirname, 'images/cg.png'); // Output path for the generated Codingame image.

/**
 * Asynchronously writes text content to the README.md file.
 * @param {string} text The text to write to README.md.
 * @returns {Promise<boolean>} A promise that resolves to true if writing was successful, false otherwise.
 */
async function updateREADMEFile(text) {
  try {
    await fs.writeFile('./README.md', text);
    console.log("README.md successfully updated."); // Log success
    return true;
  } catch (error) {
    console.error("Error writing README.md:", error); // Log error
    return false;
  }
}

/**
 * Main function to orchestrate the process of fetching data,
 * generating HTML/image, and updating the README.
 */
async function main() {
  // Step 1: Fetch raw data from Codingame API
  const rawData = await fetchCodingameData();
  if (!rawData) {
    console.error("Main: Failed to fetch Codingame data. Exiting script.");
    return; // Exit if no data
  }

  // Step 2: Process the fetched data
  dataCG = processCodingameData(rawData);
  if (!dataCG) {
    console.error("Main: Failed to process Codingame data. Exiting script.");
    return; // Exit if processing failed
  }

  // Step 3: Generate HTML for the Codingame image
  const codingameImageHtml = await generateCodingameImageHtml(dataCG);
  if (!codingameImageHtml) {
    console.error("Main: Failed to generate Codingame image HTML. Continuing without image generation.");
    // Not necessarily exiting, as README update might still be possible.
  } else {
    // Step 4: Convert the HTML to an image
    const imageSuccess = await htmlToImage(codingameImageHtml, outputPath);
    if (!imageSuccess) {
      console.error("Main: Failed to create HTML image. Check logs for details.");
      // Continue to update README even if image fails.
    }
  }

  // Step 5: Populate the README template
  // The `readme` variable (imported from readme.js) is the template string for README.md.
  // dataCG contains Codingame stats, which will fill in placeholders like <#level>, <#rank>, etc.
  // General placeholders like <#today_date>, <#signing>, <#special_day> are also filled.
  const newREADME = await populateHtmlTemplate(readme, dataCG); // Added await
  // console.log(newREADME); // Logging the whole README is usually too verbose.

  // Step 6: Update the README.md file
  const readmeSuccess = await updateREADMEFile(newREADME);
  if (!readmeSuccess) {
    console.error("Main: Failed to update README.md. Check logs for details.");
  } else {
    console.log("Main: Script completed successfully.");
  }
}

main();
