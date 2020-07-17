# d64-utils
Utilities to work with d64 files in node.js

## API

attach(filename)
  loads file contents into instance from filename.
  does not (will not?) support taking a buffer or a network location

validate()
  does some very basic validation of the disk

list()
  displays directory listing of the disk

## Example Usage:

```javascript
const c1541 = require('./c1541.js');

const disk = new c1541();
disk.attach('./myDisk.d64');

console.log(`Disk is valid: ${disk.validate()}`);
console.log(`BAM info:`);
console.log(disk.getBAMInfo());

const listing = disk.list();
if (listing !== null) { listing.forEach(l => console.log(l)); }
```
