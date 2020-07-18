// use this line if you've installed the npm package
// instead of the line below it.
// const c1541 = require('@mich-cook/d64-utils');
const c1541 = require('./c1541.js');
const diskName = require('./diskName.js');

const disk = new c1541(diskName);

// or if the instance didn't pass diskName
// attach it in a subsequent call like this:
// const disk = new c1541();
// disk.attach(diskName);

console.log(`disk is valid: ${disk.validate()}`);
console.log(`BAM info:`);
console.log(disk.getBAMInfo());

const listing = disk.list();
if (listing !== null) { listing.forEach(l => console.log(l)); }
