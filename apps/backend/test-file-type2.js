import { fileTypeStream } from 'file-type';
import { Readable } from 'stream';
const rs = Readable.from(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]));
const webStream = Readable.toWeb(rs);
fileTypeStream(webStream).then(s => {
  console.log('File type:', s.fileType);
  const nodeStream = Readable.fromWeb(s);
  console.log('Is Node Stream?', nodeStream instanceof Readable);
}).catch(console.error);
