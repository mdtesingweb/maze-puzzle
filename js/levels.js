// Coding Maze Rescue — dữ liệu 15 level V7.2 (theo docs/SPEC.md).
// V7.2: mê cung có lựa chọn thật (ngã rẽ, ngõ cụt, đường vòng, đường tắt bị chặn),
// không còn là hành lang đơn. Block không có id: {type:'MOVE'|'LEFT'|'RIGHT'|'JUMP'}
// hoặc {type:'REPEAT', count, body:[...]}. Mọi màn đã qua tests/validate-levels.js.
(function () {
  'use strict';

  function M() { return { type: 'MOVE' }; }
  function L() { return { type: 'LEFT' }; }
  function R() { return { type: 'RIGHT' }; }
  function J() { return { type: 'JUMP' }; }
  function REP(count, body) { return { type: 'REPEAT', count: count, body: body }; }

  var CMLevels = [
    {
      n: 1, name: 'Bước đầu tiên', friend: 'Gà Mơ',
      story: 'Gà Mơ bị kẹt ở cuối con đường thẳng, hãy dẫn Robot đi thẳng tới cứu bạn ấy nhé!',
      hint: 'Thêm 3 lệnh Đi tới rồi bấm RUN.',
      grid: ['#####', '#S..F', '#####'],
      startDir: 'E', tools: ['MOVE'],
      solution: [M(), M(), M()]
    },
    {
      n: 2, name: 'Rẽ phải nào', friend: 'Mèo Miu',
      story: 'Mèo Miu đang chờ Robot ở góc đường bên dưới, đi thẳng rồi rẽ phải là tới nơi!',
      hint: 'Đi tới cuối đường, dùng lệnh Rẽ phải, rồi đi tiếp.',
      grid: ['#####', '#S..#', '###.#', '#..F#', '#####'],
      startDir: 'E', tools: ['MOVE', 'RIGHT'],
      solution: [M(), M(), R(), M(), M()]
    },
    {
      n: 3, name: 'Sửa lệnh đầu tiên', friend: 'Thỏ Bông',
      story: 'Thỏ Bông đang chờ ở phía trên, nhưng chương trình có sẵn đang bị sai và làm Robot đâm vào tường — hãy sửa nó nhé!',
      hint: 'Bấm RUN xem Robot sai ở đâu, rồi xóa lệnh thừa và cho Robot quay trái ngay từ đầu.',
      grid: ['#####', '#F..#', '#.###', '#S..#', '#####'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT'],
      prefill: [M(), L(), M(), M()],
      solution: [L(), M(), M()]
    },
    {
      n: 4, name: 'Ngã ba đầu tiên', friend: 'Cún Nâu',
      story: 'Cún Nâu ở góc dưới bên phải. Từ chỗ bắt đầu có hai đường đi — một đường vòng lên trên, một đường đi xuống dưới, cả hai đều tới nơi. Em chọn đường nào?',
      hint: 'Nhìn kỹ cả hai hướng trước khi viết lệnh: đi lên trên thì vòng vèo, đi xuống dưới thì thẳng hơn một chút.',
      grid: ['########', '#S..#..#', '#.#.#..#', '#.#....#', '#.####.#', '#.....F#', '########'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT'],
      solution: [M(), M(), R(), M(), M(), L(), M(), M(), M(), R(), M(), M()]
    },
    {
      n: 5, name: 'Đường thẳng bị chặn', friend: 'Chim Sẻ',
      story: 'Chim Sẻ ở ngay phía trước mặt, nhìn thấy rõ luôn! Nhưng có một bức tường chắn ngang giữa đường — đi thẳng là đâm vào tường đấy.',
      hint: 'Đường thẳng bị chặn rồi. Thử đi vòng xuống dưới rồi vòng lên lại xem sao.',
      grid: ['#######', '#S..#F#', '#.#.#.#', '#.....#', '#######'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT'],
      solution: [M(), M(), R(), M(), M(), L(), M(), M(), L(), M(), M()]
    },
    {
      n: 6, name: 'Đường tắt là ngõ cụt', friend: 'Ếch Xanh',
      story: 'Ếch Xanh ở góc dưới bên phải. Đường đi thẳng lên trên trông ngắn nhất, nhưng coi chừng — nó dẫn vào ngõ cụt đấy!',
      hint: 'Có hai hướng đi từ chỗ bắt đầu. Một hướng là ngõ cụt — hãy thử hướng còn lại.',
      grid: ['#########', '#S......#', '#.#####.#', '#.#...###', '#...#..F#', '#########'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT'],
      solution: [R(), M(), M(), M(), L(), M(), M(), L(), M(), R(), M(), M(), R(), M(), L(), M(), M()]
    },
    {
      n: 7, name: 'Cái hố đầu tiên', friend: 'Heo Hồng',
      story: 'Heo Hồng ở ngay bên kia một cái hố sâu — đường thì ngắn nhưng Robot không thể bước qua hố được đâu!',
      hint: 'Dùng lệnh Nhảy để qua hố, đừng bước thẳng vào hố nhé.',
      grid: ['######', '#S.HF#', '######'],
      startDir: 'E', tools: ['MOVE', 'JUMP'],
      solution: [M(), J()]
    },
    {
      n: 8, name: 'Nhảy tắt hay đi vòng?', friend: 'Gấu Mật',
      story: 'Gấu Mật ở cuối đường. Nhảy qua hố thì tới nhanh, nhưng đi vòng xuống dưới cũng tới nơi — em thích cách nào hơn?',
      hint: 'Thử cả hai cách: một cách dùng lệnh Nhảy, một cách chỉ đi bộ vòng xuống dưới.',
      grid: ['#########', '#S.H...F#', '#.#####.#', '#.......#', '#########'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'JUMP'],
      solution: [M(), J(), M(), M(), M()]
    },
    {
      n: 9, name: 'Sửa cú nhảy', friend: 'Cáo Cam',
      story: 'Cáo Cam đang chờ ở dưới vườn, nhưng chương trình có sẵn bị sai làm Robot rơi xuống hố — hãy tìm và sửa nó!',
      hint: 'Chạy thử chương trình sẵn: Robot bước thừa một bước trước khi nhảy đấy.',
      grid: ['#######', '#S.H..#', '#####.#', '#..F..#', '#######'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'JUMP'],
      prefill: [M(), M(), J(), M(), R(), M(), M(), R(), M(), M()],
      solution: [M(), J(), M(), R(), M(), M(), R(), M(), M()]
    },
    {
      n: 10, name: 'Cầu thang ba bậc', friend: 'Khỉ Con',
      story: 'Khỉ Con ở cuối cầu thang có ba bậc giống hệt nhau. Mỗi bậc đều là: đi, rẽ phải, đi, rẽ trái — một mẫu lệnh hoàn hảo để lặp lại!',
      hint: 'Màn này chỉ dùng tối đa 7 khối. Dùng khối Lặp lại ×3 với mẫu bốn lệnh trong, rồi đi thêm 1 bước nữa.',
      grid: ['#######', '#S.####', '##..###', '###..##', '####.F#', '#######'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'REPEAT'],
      maxBlocks: 7,
      solution: [REP(3, [M(), R(), M(), L()]), M()]
    },
    {
      n: 11, name: 'Hai gian phòng giống nhau', friend: 'Vịt Vàng',
      story: 'Vịt Vàng ở sau hai gian phòng giống hệt nhau, rồi tới một đoạn đường khác hẳn. Đoạn nào nên lặp, đoạn nào thì không?',
      hint: 'Màn này chỉ dùng tối đa 10 khối. Chỉ lặp phần giống nhau thôi — đoạn cuối khác hẳn thì đừng nhét vào trong Lặp.',
      grid: ['########', '#S..####', '###...##', '#####.##', '#####.##', '#####F##', '########'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'REPEAT'],
      maxBlocks: 10,
      solution: [REP(2, [M(), M(), R(), M(), L()]), R(), M(), M()]
    },
    {
      n: 12, name: 'Ba nhịp cầu', friend: 'Nhím Nhỏ',
      story: 'Nhím Nhỏ ở cuối con đường có ba nhịp cầu giống hệt nhau: đi, nhảy, đi. Lặp thiếu một nhịp là dừng giữa đường đấy!',
      hint: 'Màn này chỉ dùng tối đa 5 khối. Mẫu lệnh là: đi, nhảy, đi — lặp đúng 3 lần.',
      grid: ['###############', '#S.H...H...H.F#', '###############'],
      startDir: 'E', tools: ['MOVE', 'JUMP', 'REPEAT'],
      maxBlocks: 5,
      solution: [REP(3, [M(), J(), M()])]
    },
    {
      n: 13, name: 'Hành trình ba chặng', friend: 'Cừu Mây',
      story: 'Cừu Mây ở cuối một hành trình dài: đầu tiên chọn đường ở ngã ba, rồi leo cầu thang lặp lại, cuối cùng nhảy qua hố để tới nơi!',
      hint: 'Chia hành trình thành ba chặng: ngã ba thì tránh ngõ cụt, cầu thang thì dùng Lặp lại, cuối cùng nhớ Nhảy qua hố.',
      grid: ['############', '#S.......###', '###.#.######', '###.#...####', '######..####', '#######..HF#', '############'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'JUMP', 'REPEAT'],
      solution: [M(), M(), M(), M(), R(), M(), M(), L(), REP(2, [M(), R(), M(), L()]), M(), J()]
    },
    {
      n: 14, name: 'Sửa hai lỗi', friend: 'Rùa Chậm',
      story: 'Rùa Chậm chờ ở cuối đường, nhưng chương trình có sẵn có tới HAI chỗ sai: số lần lặp chưa đủ, và có một lệnh rẽ sai ở cuối. Tìm cả hai nhé!',
      hint: 'Chạy thử rồi đếm lại: cầu thang cần lặp mấy lần? Và lệnh rẽ cuối cùng có đúng hướng không?',
      grid: ['###########', '#S#########', '#.#########', '#...#...HF#', '#.##..#####', '#....######', '###########'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'JUMP', 'REPEAT'],
      prefill: [R(), M(), M(), M(), M(), L(), M(), M(), REP(1, [M(), L(), M(), R()]), M(), R(), J()],
      solution: [R(), M(), M(), M(), M(), L(), M(), M(), REP(2, [M(), L(), M(), R()]), M(), M(), J()]
    },
    {
      n: 15, name: 'Giải cứu Bạn Sao', friend: 'Bạn Sao',
      story: 'Nhiệm vụ cuối cùng! Bạn Sao ở nơi sâu nhất của mê cung: qua ngã ba, nhảy qua hố, leo cầu thang lặp lại — và coi chừng ngõ cụt ở gần đích!',
      hint: 'Đi từng chặng một: tránh ngõ cụt ở ngã ba, nhảy qua hố, leo cầu thang bằng Lặp lại, rồi đừng rẽ nhầm vào ngõ cụt cuối.',
      grid: ['############', '#S....######', '###.#.######', '###.#.######', '#####.######', '#####..H.###', '#######..###', '########.###', '########..##', '#########..#', '##########F#', '############'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'JUMP', 'REPEAT'],
      solution: [M(), M(), M(), M(), R(), M(), M(), M(), M(), L(), M(), J(), R(), M(), M(), M(), L(), REP(2, [M(), R(), M(), L()])]
    }
  ];

  globalThis.CMLevels = CMLevels;
  if (typeof module !== 'undefined' && module.exports) { module.exports = CMLevels; }
})();
