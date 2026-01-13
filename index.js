import puppeteer from "puppeteer";
import axios from "axios";
import chalk from "chalk";
import prompts from "prompts";

const MAIN_BK_SITE = "https://sso.hcmut.edu.vn/cas/login?service=https%3A%2F%2Fmybk.hcmut.edu.vn%2Fapp%2Flogin%2Fcas";
const MAIN_BK_SCORE_SITE = "https://mybk.hcmut.edu.vn/api/v1/student/subject-grade/detail";

var totalPointTimesCredit = 0;
var totalCredit = 0;

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
        const schar = (credits > 1) ? 's' : '';

        totalCredit += credits;

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
        console.log(chalk.bold.cyanBright(`${index + 1}. [${subCode}] ${subNameEn}`));
        console.log(chalk.gray(`   ${subNameVi} `) + chalk.yellow(`(${credits} credit${schar})`));

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

        let scale4pt = getScale4Point(totalGrade);
        totalPointTimesCredit += (scale4pt * credits);

        console.log(chalk.bold(`   -> `) + chalk.bold(`Total: `) + colorGrade(totalGrade) + chalk.bold(' (GPA score: ') + colorGpa(scale4pt) + chalk.bold(')'));

        console.log("");
    });

    // Tổng kết
    let gpa = totalCredit > 0 ? Math.round(totalPointTimesCredit/totalCredit *10)/10 : 0;
    let classification = getClassification(gpa);
    // console.log(`Total points of this semester in 4.0-scale: ${totalPointTimesCredit}`);
    // console.log(`Total credits of semester: ${totalCredit}`);
    console.log(`GPA of semester: ${gpa}`);
    console.log(`Classification of this semester: ${classification}`);
};

function colorGrade(gradeStr) {
    const score = parseFloat(gradeStr);
    if (isNaN(score)) return chalk.white(gradeStr);
    if (score >= 8.5) return chalk.green.bold(gradeStr);
    if (score >= 7.0) return chalk.cyan.bold(gradeStr);
    if (score >= 5.0) return chalk.yellow.bold(gradeStr);
    return chalk.red.bold(gradeStr);
}
function getScale4Point(gradeStr){
    const score = parseFloat(gradeStr);
    if (8.5 <= score) {
        return 4.0;
    }
    else if (8.0 <= score) {
        return 3.5;
    }
    else if (7.0 <= score) {
        return 3.0;
    }
    else if (6.5 <= score) {
        return 2.5;
    }
    else if (5.5 <= score) {
        return 2.0;
    }
    else if (5.0 <= score) {
        return 1.5;
    }
    else if (4.0 <= score) {
        return 1.0;
    }
    else {
        return 0.0;
    }
}
function colorGpa(point){
    if (point == 4.0) return chalk.green.bold(point);
    else if (point >= 3.0) return chalk.cyan.bold(point);
    else if (point > 0) return chalk.yellow.bold(point);
    else return chalk.red.bold(point);

}
function getClassification(pt){
    if (pt >= 3.6) return chalk.green.bold("Excellent");
    else if (pt >= 3.2) return chalk.green.bold("Very Good");
    else if (pt >= 2.5) return chalk.cyan.bold("Good");
    else if (pt >= 2.0) return chalk.yellow.bold("Average"); 
    else if (pt >= 1.0) return chalk.yellow.bold("Below Average");
    else return chalk.red.bold("Poor");
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
            message: "Enter BKNetID: ",
        },
        {
            type: "password",
            name: "password",
            message: "Enter password: ",
        },
        {
            type: "number",
            name: "semester",
            message: "Enter semester (231, 241, etc.): ",
        },
    ]);

    // This part is used for dev only
    // const response = {
    //     username: "yourName",
    //     password: "yourPassword",
    //     semester: "251"
    // }

    console.log(chalk.cyan.bold("Logging in as: ") + chalk.yellow.bold(response.username));

    try {
        await main(response.username, response.password, response.semester);
    } catch (error) {
        console.log(chalk.red.bold("Error on logging in, please check your information and try again!"));
        process.exit(1);
    }
    // await main(response.username, response.password, response.semester);
};

start();
