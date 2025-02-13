const { Storage } = require('@google-cloud/storage');
const path = require('path');
const bucketName = 'pub-sub-senso'

// 创建存储对象
const storage = new Storage({ keyFilename: ".env/data-segment-450509-s6-cab3f8e582fc.json" });

async function uploadFileToGoogleCloud() {
  // 获取今天的日期（格式：YYYY-MM-DD）
  const currentDate = new Date();
  const folderName = currentDate.toISOString().split('T')[0];  // 'YYYY-MM-DD'

  // 构造目标文件路径，文件名可以自定义
  const destinationPath = `dataintxt/${folderName}/DataSet_test.TXT`;

  try {
    // 上传文件
    await storage.bucket(bucketName).upload("Data/DataSet_test.TXT", {
      destination: destinationPath,
    });
    console.log("文件上传成功！");
  } catch (error) {
    console.error("上传失败:", error);
  }
}


async function downloadFileFromGoogleCloud(date) {
  // 如果用户传入日期，使用该日期，否则使用今天的日期
  const folderName = date || new Date().toISOString().split('T')[0];  // 默认是今天的日期
  const fileName = 'DataSet_test.TXT';  // 文件名

  // 构造目标文件路径
  const sourcePath = `dataintxt/${folderName}/${fileName}`;
  const destinationPath = path.join(__dirname, `../Data/downloaded_${fileName}`);  // 下载到本地的文件名

  try {
    // 下载文件
    await storage.bucket(bucketName).file(sourcePath).download({ destination: destinationPath });
    console.log(`文件下载成功！保存为: ${destinationPath}`);
  } catch (error) {
    console.error("下载失败:", error);
  }
}


async function listFilesInDirectory() {
  const directoryPrefix = 'dataintxt/'; // 你想要列出文件的“目录”前缀

  try {
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: directoryPrefix, // 使用目录前缀
    });

    console.log('目录下的文件：');
    files.forEach(file => {
      console.log(file.name);  // 输出每个文件的名称
    });
  } catch (error) {
    console.error('列出文件失败:', error);
  }
}



// 调用上传函数
uploadFileToGoogleCloud();

listFilesInDirectory();

// 调用下载函数，传入日期参数
downloadFileFromGoogleCloud('2025-02-13');  // 例如下载2025年2月11日的文件

