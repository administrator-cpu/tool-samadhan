import { fileTypeStream } from 'file-type';
import { Readable } from 'stream';
const rs = Readable.from(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]));
fileTypeStream(rs).then(s => {
  console.log('Has pipe?', typeof s.pipe === 'function');
  console.log('Is Node Stream?', s instanceof Readable);
  console.log('File type:', s.fileType);
}).catch(console.error);
