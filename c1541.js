// utilities for .d64 image files

// sources:
// http://unusedino.de/ec64/technical/formats/d64.html
// http://petlibrary.tripod.com/D64.HTM

// general info:
// tracks go from 1 to 35 (sometimes up to 40)
// sectors (in tracks) start at 0
// directory listing starts at 18/1

// convention:
// track/sector locations notated as T/S

/*

  // NOTE: sectors/track vary

  Track #Sect #SectorsIn D64 Offset
  ----- ----- ---------- ----------
    1     21       0       $00000
    2     21      21       $01500
    3     21      42       $02A00
    4     21      63       $03F00
    5     21      84       $05400
    6     21     105       $06900
    7     21     126       $07E00
    8     21     147       $09300
    9     21     168       $0A800
   10     21     189       $0BD00
   11     21     210       $0D200
   12     21     231       $0E700
   13     21     252       $0FC00
   14     21     273       $11100
   15     21     294       $12600
   16     21     315       $13B00
   17     21     336       $15000
   18     19     357       $16500
   19     19     376       $17800
   20     19     395       $18B00
   21     19     414       $19E00
   22     19     433       $1B100
   23     19     452       $1C400
   24     19     471       $1D700
   25     18     490       $1EA00
   26     18     508       $1FC00
   27     18     526       $20E00
   28     18     544       $22000
   29     18     562       $23200
   30     18     580       $24400
   31     17     598       $25600
   32     17     615       $26700
   33     17     632       $27800
   34     17     649       $28900
   35     17     666       $29A00
   36*    17     683       $2AB00
   37*    17     700       $2BC00
   38*    17     717       $2CD00
   39*    17     734       $2DE00
   40*    17     751       $2EF00

*/

const fs = require('fs');

// constants for a disk
const sectorSize = 0x100;    // 256 bytes per sector

/*
  List of validation checks attempting to ensure the disk is valid
  and hopefully safe to use.

  So far just checking the size of the file and only handling
  35-track disks.

  When 40-track disks are supported, the file sizes are ready to go.
*/
const validate = (disk) => {

  switch(disk.length) {
    case 174848:  // 35 track, no errors
    case 175531:  // 35 track, 683 error bytes
//    case 196608:  // 40 track, no errors
//    case 197376:  // 40 track, 768 error bytes
      break;
    default:
      return false;
  }

  // no failed validation checks
  return true;

};

/*
  Take a file location and return a representation of the
  disk for use with the other functionailty.

  Eventually this should be internalized better.
  Well, eventually we'll structure the whole thing better.
*/
const attach = (file) => {
  return fs.readFileSync(file);
};

/*
  Generate disk information from the Block Availability Map (BAM).
  Using the base address and offsets instead of numerous
  magic addresses with the hope that it's easier to follow.
  The comments also intend to convey things that are
  ignored and why.
*/
const getBAMInfo = (disk) => {
  const BAMOffset = 0x16500;  // ends at 0x165FF
  let BAMInfo = {};

  // 0x00-0x01 location of start of directory listing
  // advised in spec to ignore and always use 18/1

  // dos version is either 0x41 "A" or 0x50 "P"
  // appears to be second character of dos type below
  BAMInfo.dos_version_type = String.fromCharCode(disk[BAMOffset + 0x02]);

  // 0x03 ignored (unused)
  // 0x04-0x8F are actual BAM entries handled below

  // name of the disk (displayed at top of directory listing)
  // currently not handling c64 characters
  // disk name is padded to 16 characters (0x9F) with 0xA0 values
  BAMInfo.name = disk.slice(BAMOffset + 0x90, BAMOffset + 0x90 + 16).filter(ch => ch !== 0xA0).toString();

  // 0xA0-0xA1 ignored (0xA0)

  // displayed between disk name and dos type
  // in the directory listing
  BAMInfo.id = String.fromCharCode(disk[BAMOffset + 0xA2]) + String.fromCharCode(disk[BAMOffset + 0xA3]);

  // 0xA4 ignored (0xA0)

  // DOS type which is frequently "2A", but might also be
  // the values "4A" or "2P"
  BAMInfo.dostype = String.fromCharCode(disk[BAMOffset + 0xA5]) + String.fromCharCode(disk[BAMOffset + 0xA6]);

  // 0xA7-0xAA ignored (0xA0)
  // 0xAB-0xFF currently unsupported 40-track information, else 0x00 values

  // 0x04 - 0x8F are actual BAM entries (from above)
  // free blocks don't match the emulators or the math
  // but it's the right number according to the spec
  // as far as I can tell even when manually
  // inspecting the bits
  BAMInfo.free = 0;
  for (let i = 0x04; i <= 0x8C; i += 0x04) {
    BAMInfo.free += Number(disk[BAMOffset + i]);
  }

  return BAMInfo;
};


/*
  For a specific track/sector offset, get the directory entry
  that is located there.

  Entries are planned to be wholly in track 18, but it's
  allegedly possible to escape to a different track. Not sure
  if there's any sort of sanity check we can do so leaving
  it alone for now. It looks like we might be able to expect
  they only start on addresses that are a multiple of 0x20,
  but there's nothing that says that must be the case that
  I've seen.
*/
const getDirectoryEntryForOffset = (disk, offset) => {
  // 0x01-0x02 are pointer to next directory listing sector
  // and are only valid for first entry of the sector.
  // (0x00 0x00 for the rest)
  // this won't be included in the listing entry response
  // and is expected to be handled outside of this function.

  // binary string of file type marks
  let [ closed, locked,,,, ...typeBits ] = disk[offset + 0x2].toString(2).split('');
  let fileType = typeBits.join('');

  switch(fileType) {
    case '000': fileType = 'DEL'; break;
    case '001': fileType = 'SEQ'; break;
    case '010': fileType = 'PRG'; break;
    case '011': fileType = 'USR'; break;
    case '100': fileType = 'REL'; break;
    default:  // appears to be invalid
      return null;
  }

  const pointerToActualFileTrack  = disk[offset + 0x3];
  const pointerToActualFileSector = disk[offset + 0x4];

  // pointers appear to be invalid. not a real entry.
  // remember: tracks start at 1.
  if ((pointerToActualFileTrack === 0x00) && (pointerToActualFileSector === 0x00)) {
    return null;
  }

  // filename is 16 characters and padded at end with
  // 0xA0 characters which presumably are not
  // valid in filenames.
  //
  // TODO: handle c64 chars?
  //   Probably need a custom font to display, but
  //   not sure yet what/if we need to do anything in JS
  const filename = disk.slice(offset + 0x5, offset + 0x5 + 16).filter(ch => ch !== 0xA0).toString();

  // $15/$16: location of first side-sector for REL file
  // $17: REL file record length
  // $18 - $1D: only used by GEOS

  const totalSize = disk[offset + 0x1E] + disk[offset + 0x1F];

  return {
    "name": filename,
    "size": totalSize,
    "type": fileType,
    closed,
    locked
  };
};

const getFileList = disk => {
  let start = 0x16600;  // track 18, sector 1. ignore the BAM.
  let list = [];

  // these basically duplicate start above
  // improve seeking to these can generate that
  let nextListingTrack  = 0x12;
  let nextListingSector = 0x04;

  // 0x00/0xFF indicates end of directory linked list
  // keep going until we reach the end
  while((nextListingTrack !== 0x00) && (nextListingSector !== 0xFF)) {
    // the 8 possible entries in a sector are 0x20 apart
    for (let i = 0x0; i <= 0xE0; i += 0x20) {
      const entry = getDirectoryEntryForOffset(disk, start + i);
      // drop entries that look to be invalid/deleted/empty.
      // there's nothing in the spec that says that we can't have
      // a blank spot then an entry after it even though that
      // seems highly unlikely. so for now we won't bail on the
      // sector upon the first empty entry.
      if (entry !== null) {
        list.push(entry);
      }
    }

    // T/S pointer to next sector in the list
    nextListingTrack  = disk[start];
    nextListingSector = disk[start + 0x01];

    // TODO: BUG: This only works in track 18.
    start = 0x16500 + (sectorSize * nextListingSector);
  }

  return list;

};

const list = disk => {
  const BAM = getBAMInfo(disk);
  const files = getFileList(disk);
  let list = [
    `0 "${BAM.name.padEnd(16, ' ')}" ${BAM.id} ${BAM.dostype}`
  ];

  files.forEach(file => {
    const quotedFilename = `"${file.name}"`;
    list.push(`${String(file.size).padEnd(6, ' ')}${quotedFilename.padEnd(19, ' ')} ${file.type}`);
  });

  list.push(`${BAM.free} BLOCKS FREE`);

  return list;

};

module.exports = { attach, validate, list, getBAMInfo };
