
import { chromium, Page, Browser, BrowserContext } from 'playwright';
import { Workbook } from 'exceljs'
const webUrl = 'https://www.redbubble.com';

interface ImageOption {
    image: string,
    title: string,
    tags: string,
    description: string,
    imageToCpy: string
}

async function uploadImage(page: Page, urlToCopy: string, newImageOption: ImageOption) {
    console.log('uploading')
    console.log({ urlToCopy, newImageOption })

    await page.goto(urlToCopy);
    await page.setInputFiles('input#select-image-base', `images/${newImageOption.image}`);
    await page.fill('#work_title_en', newImageOption.title);
    await page.fill('#work_tag_field_en', newImageOption.tags);
    await page.fill('#work_description_en', newImageOption.description);
    await page.waitForSelector('.single-upload.has-image', { timeout: 120000 });
    await page.waitForTimeout(3000);

    await page.check('input#rightsDeclaration');

    await page.screenshot({ path: `results/${newImageOption.image}`, fullPage: true });

    await page.click('input#submit-work');

    // await page.waitForResponse(response => response.url() === `${webUrl}/portfolio/images` && response.status() === 302, { timeout: 120000 });
    await page.waitForNavigation({timeout:120000});

    console.log('upload complete');
}


(async () => {

    const browser = await chromium.launchPersistentContext('session', { headless: false });
    const page = await browser.newPage();
    await page.goto(`${webUrl}/portfolio/manage_works?ref=account-nav-dropdown`);
    await page.waitForSelector('.manage-works-nav_heading', { timeout: 1200000 });

    const workbook = new Workbook();
    await workbook.xlsx.readFile('data.xlsx');


    const worksheet = workbook.getWorksheet(1);
    const uploadItem: ImageOption[] = [];
    worksheet.eachRow(function (row, rowNumber) {
        if(rowNumber != 1 && row.getCell(6).value != 'success'){
        // if (rowNumber != 1) {
            uploadItem.push({
                imageToCpy: `${row.getCell(1).value}`,
                image: `${row.getCell(2).value}`,
                title: `${row.getCell(3).value}`,
                description: `${row.getCell(4).value}`,
                tags: `${row.getCell(5).value}`,
            });
            row.getCell(6).value = 'success';
            row.commit();
        }
    });
    console.log(uploadItem);
    for (const item of uploadItem) {
        await uploadImage(page, item.imageToCpy, item);
    }


    // Create pages, interact with UI elements, assert values
    await browser.close();
    await workbook.xlsx.writeFile('data.xlsx');
})();

