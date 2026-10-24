// Coding Maze Rescue — dữ liệu 15 level (theo docs/SPEC.md).
// Block không có id: {type:'MOVE'|'LEFT'|'RIGHT'|'JUMP'} hoặc {type:'REPEAT', count, body:[...]}.
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
      n: 4, name: 'Hành lang quanh co', friend: 'Cún Nâu',
      story: 'Cún Nâu bị lạc trong hành lang quanh co như mê cung, Robot phải đi vòng vèo mới tới được chỗ bạn ấy.',
      hint: 'Tới cuối mỗi hành lang thì dừng lại nhìn xem đường đi rẽ về hướng nào.',
      grid: ['######', '#S...#', '####.#', '#....#', '#.####', '#...F#'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT'],
      solution: [M(), M(), M(), R(), M(), M(), R(), M(), M(), M(), L(), M(), M(), L(), M(), M(), M()]
    },
    {
      n: 5, name: 'Ngõ cụt bí mật', friend: 'Chim Sẻ',
      story: 'Chim Sẻ trốn ở góc xa của mê cung, nhưng có một lối đi giả đang đánh lừa Robot đấy!',
      hint: 'Có một lối là ngõ cụt — hãy đi xuống trước, đừng đi thẳng sang phải.',
      grid: ['######', '#S.#F#', '#.##.#', '#....#', '######'],
      startDir: 'S', tools: ['MOVE', 'LEFT', 'RIGHT'],
      solution: [M(), M(), L(), M(), M(), M(), L(), M(), M()]
    },
    {
      n: 6, name: 'Vòng quanh hồ', friend: 'Ếch Xanh',
      story: 'Ếch Xanh ngồi ở bờ bên kia của chiếc hồ dài, Robot phải đi vòng hết một vòng mới gặp được bạn ấy.',
      hint: 'Đi vòng quanh hồ: tới cuối đường thì rẽ phải, đi xuống, rồi rẽ phải lần nữa.',
      grid: ['#######', '#S....#', '#####.#', '#F....#', '#######'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT'],
      solution: [M(), M(), M(), M(), R(), M(), M(), R(), M(), M(), M(), M()]
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
      n: 8, name: 'Nhảy qua góc vườn', friend: 'Gấu Mật',
      story: 'Gấu Mật chờ ở góc vườn phía dưới, Robot phải nhảy qua hố rồi đi một vòng dài mới tới nơi.',
      hint: 'Nhảy qua hố, đi tới cuối hàng, vòng xuống rồi đi ngược lại về phía trái.',
      grid: ['########', '#S.H...#', '######.#', '#F.....#', '########'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'JUMP'],
      solution: [M(), J(), M(), M(), R(), M(), M(), R(), M(), M(), M(), M(), M()]
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
      n: 10, name: 'Bước đều bước', friend: 'Khỉ Con',
      story: 'Khỉ Con ở cuối một con đường thẳng dài — Robot sẽ phải bước đều, bước đều mãi mới tới!',
      hint: 'Thử dùng khối Lặp lại ×4 với lệnh Đi tới ở trong, Robot sẽ tự bước 4 lần.',
      grid: ['#######', '#S...F#', '#######'],
      startDir: 'E', tools: ['MOVE', 'REPEAT'],
      solution: [REP(4, [M()])]
    },
    {
      n: 11, name: 'Cầu thang xoáy', friend: 'Vịt Vàng',
      story: 'Vịt Vàng ở dưới chân cầu thang xoáy, mỗi bậc thang đều giống hệt bậc trước — thật là một mẫu lệnh hoàn hảo!',
      hint: 'Màn này chỉ dùng tối đa 6 khối — hãy dùng khối Lặp lại để đi lại một mẫu lệnh.',
      grid: ['#######', '#S.####', '##..###', '###..##', '####..#', '#####F#', '#######'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'REPEAT'],
      maxBlocks: 6,
      solution: [REP(4, [M(), R(), M(), L()])]
    },
    {
      n: 12, name: 'Ba cái hố đều nhau', friend: 'Nhím Nhỏ',
      story: 'Nhím Nhỏ ở cuối con đường có ba cái hố giống hệt nhau xếp đều tăm tắp đang chờ Robot tới cứu.',
      hint: 'Màn này chỉ dùng tối đa 5 khối — ba cái hố giống hệt nhau, hãy dùng khối Lặp lại với mẫu: đi, đi, nhảy.',
      grid: ['###############', '#S..H...H...HF#', '###############'],
      startDir: 'E', tools: ['MOVE', 'JUMP', 'REPEAT'],
      maxBlocks: 5,
      solution: [REP(3, [M(), M(), J()])]
    },
    {
      n: 13, name: 'Đường rắn dài', friend: 'Cừu Mây',
      story: 'Cừu Mây bị lạc ở cuối con đường rắn uốn lượn qua ba hàng dài, Robot phải kiên nhẫn đi hết mới tới nơi.',
      hint: 'Đường đi uốn qua lại như con rắn: đi hết một hàng thì rẽ xuống hàng tiếp theo.',
      grid: ['#########', '#S......#', '#######.#', '#.......#', '#.#######', '#......F#', '#########'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'REPEAT'],
      solution: [M(), M(), M(), M(), M(), M(), R(), M(), M(), R(), M(), M(), M(), M(), M(), M(), L(), M(), M(), L(), M(), M(), M(), M(), M(), M()]
    },
    {
      n: 14, name: 'Sửa vòng lặp', friend: 'Rùa Chậm',
      story: 'Rùa Chậm chờ ở cuối đường, chương trình có sẵn chạy gần tới nơi nhưng dừng sớm một chút — hãy sửa số lần lặp cho đúng nhé!',
      hint: 'Đếm số ô còn thiếu ở đoạn đường thứ hai, rồi tăng số lần lặp của khối Lặp lại đó lên.',
      grid: ['#######', '#S....#', '#####.#', '#####.#', '#####.#', '#####F#', '#######'],
      startDir: 'E', tools: ['MOVE', 'RIGHT', 'REPEAT'],
      prefill: [REP(4, [M()]), R(), REP(3, [M()])],
      solution: [REP(4, [M()]), R(), REP(4, [M()])]
    },
    {
      n: 15, name: 'Giải cứu Bạn Sao', friend: 'Bạn Sao',
      story: 'Nhiệm vụ giải cứu cuối cùng: Bạn Sao đang chờ ở nơi sâu nhất của mê cung — hãy dùng mọi kỹ năng đã học để tới cứu bạn ấy!',
      hint: 'Xuống cầu thang bằng khối Lặp lại, rồi dùng lệnh Nhảy qua cái hố cuối cùng ngay trước chỗ Bạn Sao.',
      grid: ['########', '#S.#####', '##..####', '###..###', '####..##', '#####H##', '#####F##', '########'],
      startDir: 'E', tools: ['MOVE', 'LEFT', 'RIGHT', 'JUMP', 'REPEAT'],
      solution: [REP(3, [M(), R(), M(), L()]), M(), R(), J()]
    }
  ];

  globalThis.CMLevels = CMLevels;
  if (typeof module !== 'undefined' && module.exports) { module.exports = CMLevels; }
})();
