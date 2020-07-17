const c1541 = require('./c1541.js');
const diskName = require('./diskName.js');

const disk = new c1541();
const attached = disk.attach(diskName);
console.log(`disk is valid: ${disk.validate(attached)}`);
console.log(`BAM info:`);
console.log(disk.getBAMInfo(attached));
disk.list(attached).forEach(l => console.log(l));
