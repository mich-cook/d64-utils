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

const disk = fs.readFileSync(``);
console.log(validate(disk));
