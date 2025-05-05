// data.js
const lotteryData = {
    // 三个世界/星系
    worlds: [
        { id: 'A', name: '银河系', color: '#3498db', image: 'images/galaxies/galaxy1.png' },
        { id: 'B', name: '仙女座星系', color: '#9b59b6', image: 'images/galaxies/galaxy2.png' },
        { id: 'C', name: '三角座星系', color: '#e74c3c', image: 'images/galaxies/galaxy3.png' },
        { id: 'D', name: '三角座星系', color: '#e74c3c', image: 'images/galaxies/galaxy4.png' },
        { id: 'F', name: '三角座星系', color: '#e74c3c', image: 'images/galaxies/galaxy5.png' }
    ],
    
    // 五种鲸鱼名称及图片
    whales: [
        { name: '抹香鲸', image: 'images/whales/whale1.png' },
        { name: '蓝鲸', image: 'images/whales/whale2.png' },
        { name: '座头鲸', image: 'images/whales/whale3.png' },
        { name: '虎鲸', image: 'images/whales/whale4.png' },
        { name: '白鲸', image: 'images/whales/whale5.png' }
    ],
    
    // 背景图片
    background: 'images/background.jpg',
    
    // 60个星体名称
    celestialBodies: [
        'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10',
        'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20',
        'D21', 'D22', 'D23', 'D24', 'D25', 'D26', 'D27', 'D28', 'D29', 'D30',
        'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10',
        'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20',
        'S21', 'S22', 'S23', 'S24', 'S25', 'S26', 'S27', 'S28', 'S29', 'S30'
    ]
};

// 奖品配置
const prizeConfig = {
    firstPrize: 5, 
    secondPrize: 15,
    thirdPrize: 30
};

// 导出数据
export { lotteryData, prizeConfig };