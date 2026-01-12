import puppeteer from "puppeteer";
import axios from "axios";
import chalk from "chalk";
import prompts from "prompts";

const MAIN_BK_SITE = "https://sso.hcmut.edu.vn/cas/login?service=https%3A%2F%2Fmybk.hcmut.edu.vn%2Fapp%2Flogin%2Fcas";
const MAIN_BK_SCORE_SITE = "https://mybk.hcmut.edu.vn/api/v1/student/subject-grade/detail";

const printTranscript = (dataList) => {
    if (!dataList || dataList.length === 0) {
        console.log(chalk.yellow("No data available to display."));
        return;
    }

    dataList.forEach((item, index) => {
        const sub = item.subject || {};
        const subCode = sub.code || "---";
        const subNameEn = sub.nameEn || "";
        const subNameVi = sub.nameVi || "";
        const credits = sub.numOfCredits || 0;

        let totalGrade = "N/A";
        const components = [];
        const details = item.studentSubjectGradeDetails || [];

        details.forEach((g) => {
            const dict = g.gradeColumnDictionary || {};
            const code = dict.code;
            if (code === "tkethp" || code === "tket") {
                if (code === "tkethp") totalGrade = g.grade;
                else if (totalGrade === "N/A") totalGrade = g.grade;
            } else {
                components.push(g);
            }
        });
        console.log(chalk.bold.cyan(`${index + 1}. [${subCode}] ${subNameEn}`));
        console.log(chalk.gray(`   ${subNameVi} `) + chalk.yellow.dim(`(${credits} credits)`));

        if (components.length > 0) {
            components.forEach((comp) => {
                const dict = comp.gradeColumnDictionary || {};
                const nameEn = dict.nameEn || dict.code;
                const nameVi = dict.nameVi || "";
                let label = nameEn;
                if (nameVi) label += ` (${nameVi})`;
                const paddedLabel = label.padEnd(35);

                console.log(
                    chalk.white(`   - `) +
                        `${paddedLabel}` +
                        chalk.dim(` ${comp.percentage}%: `) +
                        colorGrade(comp.grade)
                );
            });
        } else {
            console.log(chalk.gray(`   - (No detailed components)`));
        }

        console.log(chalk.bold(`   -> `) + chalk.bold(`Total: `) + colorGrade(totalGrade));

        console.log("");
    });
};

function colorGrade(gradeStr) {
    const score = parseFloat(gradeStr);
    if (isNaN(score)) return chalk.white(gradeStr);
    if (score >= 8.5) return chalk.green.bold(gradeStr);
    if (score >= 7.0) return chalk.blue.bold(gradeStr);
    if (score >= 5.0) return chalk.yellow.bold(gradeStr);
    return chalk.red.bold(gradeStr);
}

const main = async (username, password, semester) => {
    const browser = await puppeteer.launch({
        headless: true,
    });

    console.log(chalk.grey.bold("Getting secret token..."));

    const page = await browser.newPage();
    await page.goto(MAIN_BK_SITE);

    const usernameInput = await page.waitForSelector("#username", { timeout: 3000 });
    await usernameInput.type(username);

    const passwordInput = await page.waitForSelector("#password", { timeout: 1000 });
    await passwordInput.type(password);

    const submitButton = await page.waitForSelector("#fm1 > div.row.btn-row > input.btn-submit", { timeout: 1000 });
    await submitButton.click();

    const token = await page.waitForSelector("#hid_Token", { timeout: 3000 });
    const hidToken = await token.evaluate(() => document.querySelector("#hid_Token").value);

    await browser.close();

    const mssv = JSON.parse(Buffer.from(hidToken.split(".")[1], "base64").toString("utf-8"))?.sub;

    console.log(chalk.green.bold(`Found student identification number: ${mssv}`));

    const res = await axios.get(MAIN_BK_SCORE_SITE, {
        headers: {
            Authorization: hidToken,
        },
        params: {
            studentId: mssv,
            semesterYear: `20${semester}`,
        },
    });

    printTranscript(res.data.data);
};

const start = async () => {
    const response = await prompts([
        {
            type: "text",
            name: "username",
            message: "Enter bknetid: ",
        },
        {
            type: "password",
            name: "password",
            message: "Enter password: ",
        },
        {
            type: "number",
            name: "semester",
            message: "Enter semester (231, 241, ..etc): ",
        },
    ]);

    console.log(chalk.cyan.bold("Logging in as: ") + chalk.yellow.bold(response.username));

    try {
        await main(response.username, response.password, response.semester);
    } catch (error) {
        console.log(chalk.red.bold("Error on logging in, please check your information and try again!"));
        process.exit(1);
    }
};

start();
