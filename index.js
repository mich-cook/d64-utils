const c1541 = require('./c1541.js');
const diskName = require('./diskName.js');

const disk = c1541.attach(diskName);
console.log(c1541.validate(disk));
