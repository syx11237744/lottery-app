// animation.js
import { lotteryData } from './data.js';

class AnimationController {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.whales = []; // 存储鲸鱼对象的数组
        this.stars = [];  // 存储星星对象的数组
        this.worlds = []; // 存储世界对象的数组
        this.animationState = 'loading'; // loading, idle, drawing, revealing
        this.selectedWhale = null;
        this.selectedWorld = null;
        this.prizeToReveal = null;
        this.images = {}; // 存储加载的图像

        
        this.setupCanvas();
        this.loadImages().then(() => {
            this.initObjects();
            this.animationState = 'idle';
        });
    }
    
    setupCanvas() {
        // 设置canvas为全窗口大小
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 处理窗口大小调整
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.initObjects(); // 调整大小时重新初始化对象
        });
    }
    
    // 加载所有需要的图像
    async loadImages() {
        // 创建加载图像的Promise数组
        const promises = [];
        
        // 加载背景图像
        promises.push(this.loadImage('background', lotteryData.background));
        
        // 加载鲸鱼图像
        for (let i = 0; i < lotteryData.whales.length; i++) {
            const whale = lotteryData.whales[i];
            promises.push(this.loadImage(`whale_${i}`, whale.image));
        }
        
        // 加载星系图像
        for (let i = 0; i < lotteryData.worlds.length; i++) {
            const world = lotteryData.worlds[i];
            promises.push(this.loadImage(`world_${i}`, world.image));
        }
        
        // 等待所有图像加载完成
        return Promise.all(promises);
    }
    
    
    // 加载单个图像的辅助方法
    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }
    
    initObjects() {
        // 初始化鲸鱼
        this.initWhales();
        
        // 只在首次加载时初始化世界/星系 (不在reset时重新生成)
        if (!this.worlds || this.worlds.length === 0) {
            this.initWorlds();
        }
    }
    
    // 新增世界/星系初始化方法
    initWorlds() {
        // 创建五个星系，上三下二布局
        this.worlds = [];
        const worldCount = 5; // 固定为5个星系
        
        // 设置画布中心点
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height * 0.7; // 群中心点
        
        // 设置上下行的纵向位置
        const topRowY = centerY - this.canvas.height * 0.15; // 上排星系的Y坐标
        const bottomRowY = centerY + this.canvas.height * 0.15; // 下排星系的Y坐标
        
        // 星系尺寸
        const baseSizeRange = [240, 320]; // 基础尺寸范围
        
        // 创建布局位置 - 上三下二
        const positions = [
            // 上排三个
            { x: centerX - this.canvas.width * 0.35, y: topRowY },
            { x: centerX, y: topRowY + this.canvas.height * 0.05 },
            { x: centerX + this.canvas.width * 0.35, y: topRowY },
            // 下排两个
            { x: centerX - this.canvas.width * 0.2, y: bottomRowY },
            { x: centerX + this.canvas.width * 0.2, y: bottomRowY }
        ];
        
        // 记录群中心点，用于鲸鱼飞行目标
        this.worldsCenter = {
            x: centerX,
            y: centerY
        };
        
        // 创建星系
        for (let i = 0; i < Math.min(worldCount, lotteryData.worlds.length); i++) {
            const world = lotteryData.worlds[i];
            const pos = positions[i];
            const worldSize = baseSizeRange[0] + Math.abs(Math.random()) * (baseSizeRange[1] - baseSizeRange[0]);
            
            this.worlds.push({
                x: pos.x,
                y: pos.y,
                size: worldSize,
                originalSize: worldSize,
                color: world.color,
                id: world.id,
                index: i
            });
        }
    }
    
    // 新增鲸鱼初始化方法
    initWhales() {
        // 创建鲸鱼对象
        this.whales = [];
        for (let i = 0; i < 8; i++) {
            const whaleTypeIndex = Math.floor(Math.random() * lotteryData.whales.length);
            const whaleImg = this.images[`whale_${whaleTypeIndex}`];
            
            const aspectRatio = whaleImg ? whaleImg.width / whaleImg.height : 2;
            const whaleHeight = 150 + Math.random() * 30;
            const whaleWidth = whaleHeight * aspectRatio * 1.5;
            
            this.whales.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height / 2),
                speedX: (Math.random() - 0.5) * 4.5, // 增加速度
                speedY: (Math.random() - 0.5) * 3,   // 增加速度
                width: whaleWidth,
                height: whaleHeight,
                type: whaleTypeIndex,
                rotation: Math.random() > 0.5 ? 0 : Math.PI,
                name: lotteryData.whales[whaleTypeIndex].name,
            });
        }
        // 设置标志为true，因为我们已经初始化了波动参数
        this.whalesInitialized = true;
    }    
    
    // 开始动画循环
    start() {
        this.animate();
    }
    
    // 主动画循环
    animate() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 根据当前状态绘制和更新
        switch (this.animationState) {
            case 'loading':
                this.drawLoadingScreen();
                break;
                
            case 'idle':
                this.updateWhales();
                this.drawWhales();
                this.drawWorlds();
                break;
                
            case 'drawing':
                this.drawWhales();
                this.drawWorlds();
                this.animateWhaleSelection();
                break;
                
            case 'whaleMoving':
                this.drawWhales();
                this.drawWorlds();
                this.animateWhaleMoving();
                break;
                
            case 'lightFlash':
                this.drawWorlds();
                this.animateLightFlash();
                break;
                
            case 'revealing':
                this.drawWorlds();
                this.revealPrize();
                break;
                
            // 其他状态可以保留但不再使用
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    // 绘制加载屏幕
    drawLoadingScreen() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('正在加载图片资源...', this.canvas.width / 2, this.canvas.height / 2);
        
        // 绘制加载进度条
        const loadingBarWidth = 300;
        const loadingBarHeight = 20;
        const x = (this.canvas.width - loadingBarWidth) / 2;
        const y = this.canvas.height / 2 + 40;
        
        // 外边框
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, loadingBarWidth, loadingBarHeight);
        
        // 计算已加载的图像比例
        const totalImages = lotteryData.whales.length + lotteryData.worlds.length + 1; // +1 for background
        const loadedImages = Object.keys(this.images).length;
        const progress = loadedImages / totalImages;
        
        // 进度条填充
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillRect(x + 2, y + 2, (loadingBarWidth - 4) * progress, loadingBarHeight - 4);
    }
    
    // 绘制背景图片
    drawBackground() {
        const bgImage = this.images.background;
        if (bgImage) {
            // 填充整个画布
            this.ctx.drawImage(bgImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // 如果图像未加载，使用默认背景
            this.ctx.fillStyle = '#000b1e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 绘制小星星
            for (let i = 0; i < 200; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                const size = Math.random() * 2;
                const opacity = Math.random() * 0.8 + 0.2;
                
                this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    // 更新鲸鱼位置
    updateWhales() {
        // 如果是首次调用，为每条鲸鱼添加波动参数
        if (!this.whalesInitialized) {
            this.whales.forEach(whale => {
                // 为每条鱼添加波动参数
                whale.waveAmplitude = 0.8 + Math.random() * 1.2; // 波动幅度
                whale.waveFrequency = 0.002 + Math.random() * 0.001; // 波动频率
                whale.waveOffset = Math.random() * Math.PI * 2; // 随机相位偏移
            });
            this.whalesInitialized = true;
        }

        this.whales.forEach(whale => {
            // 更新水平位置 - 基本保持不变
            whale.x += whale.speedX * (whale.rotation === 0 ? 1 : -1);
            
            // 直接使用垂直速度，无波动
            whale.y += whale.speedY;
            
            // 边界检查并环绕
            if (whale.x < -whale.width) whale.x = this.canvas.width + whale.width;
            if (whale.x > this.canvas.width + whale.width) whale.x = -whale.width;
            if (whale.y < -whale.height) whale.y = this.canvas.height / 2;
            if (whale.y > this.canvas.height / 2) whale.y = -whale.height;
        });
    }
    
    // 绘制鲸鱼
    drawWhales() {
        this.whales.forEach(whale => {
            if (this.animationState === 'idle' || whale !== this.selectedWhale) {
                const whaleImg = this.images[`whale_${whale.type}`];
                if (whaleImg) {
                    this.ctx.save();
                    this.ctx.translate(whale.x, whale.y);
                    
                    // 如果需要翻转图像
                    if (whale.rotation === Math.PI) {
                        this.ctx.scale(-1, 1);
                    }
                    
                    this.ctx.drawImage(whaleImg, -whale.width/2, -whale.height/2, whale.width, whale.height);
                    this.ctx.restore();
                }
            }
        });
        
        // 绘制被选中的鲸鱼
        if (this.selectedWhale && ['drawing', 'whaleMoving', 'worldEntering', 'whaleToStars'].includes(this.animationState)) {
            const whaleImg = this.images[`whale_${this.selectedWhale.type}`];
            if (whaleImg) {
                this.ctx.save();
                this.ctx.translate(this.selectedWhale.x, this.selectedWhale.y);
                
                // 如果需要翻转图像
                if (this.selectedWhale.rotation === Math.PI) {
                    this.ctx.scale(-1, 1);
                }
                
                // 为选中的鲸鱼添加更强的发光效果
                if (this.animationState === 'drawing') {
                    this.ctx.shadowColor = 'white';
                    this.ctx.shadowBlur = 30; // 增加发光强度
                }
                
                this.ctx.drawImage(
                    whaleImg, 
                    -this.selectedWhale.width/2, 
                    -this.selectedWhale.height/2, 
                    this.selectedWhale.width, 
                    this.selectedWhale.height
                );
                this.ctx.restore();
            }
        }
    }
    
    // 绘制世界/星系
    drawWorlds() {
        this.worlds.forEach(world => {
            const worldImg = this.images[`world_${world.index}`];
            if (worldImg) {
                // 绘制星系图像
                this.ctx.drawImage(
                    worldImg, 
                    world.x - world.size/2, 
                    world.y - world.size/2, 
                    world.size, 
                    world.size
                );
            }
        });
    }
    
    // 绘制星星
    drawStars() {
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // 开始抽奖动画
    startDrawing(prize) {
        this.animationState = 'drawing';
        this.stars = [];
        
        // 存储奖品，与目的地无关
        this.prizeToReveal = prize;
        
        // 选择一只随机鲸鱼
        if (this.whales.length === 0) {
            this.initWhales();
        }
        
        // 定义屏幕中心安全区域（避免边缘鲸鱼）
        const safeMarginX = this.canvas.width * 0.2;  // 水平边缘安全距离（屏幕宽度的20%）
        const safeMarginY = this.canvas.height * 0.2; // 垂直边缘安全距离（屏幕高度的20%）
        
        // 筛选位于安全区域内的鲸鱼
        const eligibleWhales = this.whales.filter(whale => {
            return (
                whale.x > safeMarginX && 
                whale.x < (this.canvas.width - safeMarginX) &&
                whale.y > safeMarginY && 
                whale.y < (this.canvas.height / 2)  // 鲸鱼主要在上半部分游动
            );
        });
        
        let selectedWhale;
        
        // 如果有符合条件的鲸鱼，从中随机选择一条
        if (eligibleWhales.length > 0) {
            const whaleIndex = Math.floor(Math.random() * eligibleWhales.length);
            selectedWhale = eligibleWhales[whaleIndex];
            
            // 从原始数组中找到并移除这条鲸鱼
            const originalIndex = this.whales.findIndex(whale => whale === selectedWhale);
            if (originalIndex !== -1) {
                this.whales.splice(originalIndex, 1);
            }
        } else {
            // 如果没有符合条件的鲸鱼，则使用距离中心最近的鲸鱼
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 4; // 上半部分的中心
            
            // 计算每条鲸鱼到中心的距离
            this.whales.forEach(whale => {
                whale.distanceToCenter = Math.sqrt(
                    Math.pow(whale.x - centerX, 2) + 
                    Math.pow(whale.y - centerY, 2)
                );
            });
            
            // 按照到中心的距离排序
            this.whales.sort((a, b) => a.distanceToCenter - b.distanceToCenter);
            
            // 选择最靠近中心的鲸鱼
            selectedWhale = this.whales[0];
            this.whales.splice(0, 1);
        }
        
        this.selectedWhale = selectedWhale;
        
        
        // 设置鲸鱼为固定尺寸
        this.selectedWhale.height = this.selectedWhale.height * 2;
        this.selectedWhale.width = this.selectedWhale.height * 1.3;
        
        // 设置飞行目标为星系群中心点
        const targetX = this.worldsCenter.x;
        const targetY = this.worldsCenter.y;
        
        // 调整鲸鱼朝向中心点
        if (this.selectedWhale.x > targetX) {
            this.selectedWhale.rotation = Math.PI; // 左转
        } else {
            this.selectedWhale.rotation = 0; // 右转
        }
        
        // 为曲线移动生成路径点 - 飞向中心点而不是特定星系
        this.pathPoints = this.generateStraightPath(
            this.selectedWhale.x, 
            this.selectedWhale.y,
            targetX,  // 中心点X
            targetY   // 中心点Y
        );
        this.pathIndex = 0;
        
        // 设置超时进入下一个动画状态
        setTimeout(() => {
            this.animationState = 'whaleMoving';
        }, 1000);
    }
    generateStraightPath(startX, startY, endX, endY) {
        const points = [];
        const numPoints = 50; // 路径点数量
        
        // 直线路径生成
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            
            // 线性插值 - 直线方程
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;
            
            // 添加点到路径中，不添加波动效果
            points.push({ x, y });
        }
        
        return points;
    }
    // 动画：鲸鱼选择
    animateWhaleSelection() {
        // 让选中的鲸鱼搏动幅度更大
        const pulseScale = 1 + 0.2 * Math.sin(Date.now() / 100); // 增加脉动幅度到0.2
        const originalWidth = this.selectedWhale.width / pulseScale;
        const originalHeight = this.selectedWhale.height / pulseScale;
        
        this.selectedWhale.width = originalWidth * pulseScale;
        this.selectedWhale.height = originalHeight * pulseScale;
        
        // 在鲸鱼周围绘制更明显的高亮
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // 增加不透明度
        this.ctx.lineWidth = 4; // 增加线宽
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.selectedWhale.x, 
            this.selectedWhale.y, 
            this.selectedWhale.width/2 + 15, // 增加高亮轮廓的间距
            this.selectedWhale.height/2 + 15, 
            0, 0, Math.PI * 2
        );
        this.ctx.stroke();
        
        // 添加第二层内部高亮，形成双层轮廓效果
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.selectedWhale.x, 
            this.selectedWhale.y, 
            this.selectedWhale.width/2 + 5,
            this.selectedWhale.height/2 + 5, 
            0, 0, Math.PI * 2
        );
        this.ctx.stroke();
    }
    
    // 动画：鲸鱼移动到选中的世界
    animateWhaleMoving() {
        if (this.pathIndex < this.pathPoints.length - 1) {
            // 沿着预先计算的路径移动
            this.pathIndex += 2; // 通过跳过点来加快移动
            const nextPoint = this.pathPoints[this.pathIndex];
            
            // 更新鲸鱼位置
            this.selectedWhale.x = nextPoint.x;
            this.selectedWhale.y = nextPoint.y;
            
            // 根据移动方向调整朝向
            if (this.pathIndex > 0) {
                const prevPoint = this.pathPoints[this.pathIndex - 1];
                if (nextPoint.x < prevPoint.x && this.selectedWhale.rotation !== Math.PI) {
                    this.selectedWhale.rotation = Math.PI; // 左转
                } else if (nextPoint.x > prevPoint.x && this.selectedWhale.rotation !== 0) {
                    this.selectedWhale.rotation = 0; // 右转
                }
            }
            
            // 计算到中心点的距离
            const centerX = this.worldsCenter.x;
            const centerY = this.worldsCenter.y;
            const distanceToCenter = Math.sqrt(
                Math.pow(nextPoint.x - centerX, 2) + 
                Math.pow(nextPoint.y - centerY, 2)
            );
            
            // 定义接近中心点的阈值
            const proximityThreshold = 50; // 距离中心点50像素以内就算到达
            
            // 当鲸鱼接近中心点或者完成路径的85%时，开始光幕
            const progressAlongPath = this.pathIndex / (this.pathPoints.length - 1);
            if (distanceToCenter < proximityThreshold || progressAlongPath > 0.85) {
                // 根据奖品类型确定闪光颜色
                let flashColor;
                if (this.prizeToReveal.prizeType === 'first' || this.prizeToReveal.prizeType === 'special') {
                    flashColor = 'gold';
                } else if (this.prizeToReveal.prizeType === 'third') {
                    flashColor = 'blue';  // 三等奖使用蓝色
                } else {
                    flashColor = 'purple'; // 二等奖仍然使用紫色
                }
                
                // 直接跳转到光幕闪烁阶段
                this.animationState = 'lightFlash';
                this.flashStart = Date.now();
                this.flashColor = flashColor;
            }
        } else {
            // 到达终点，进入光闪效果
            this.animationState = 'lightFlash';
            this.flashStart = Date.now();
            
            // 根据奖品类型确定闪光颜色
            if (this.prizeToReveal.prizeType === 'first' || this.prizeToReveal.prizeType === 'special') {
                this.flashColor = 'gold';
            } else if (this.prizeToReveal.prizeType === 'third') {
                this.flashColor = 'blue';  // 三等奖使用蓝色
            } else {
                this.flashColor = 'purple'; // 二等奖仍然使用紫色
            }
        }
    }

    
    // 动画：鲸鱼进入世界
    animateWorldEntering() {
        // 让所有世界的中心发光
        this.ctx.save();
        this.ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 100);
        this.worlds.forEach(world => {
            this.ctx.beginPath();
            this.ctx.arc(world.x, world.y, world.size * 0.7, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
            this.ctx.fill();
        });
        this.ctx.restore();
        
        // 让鲸鱼在进入中心区域时稍微增大
        this.selectedWhale.width = Math.min(this.selectedWhale.width * 1.01, this.selectedWhale.width * 1.5);
        this.selectedWhale.height = Math.min(this.selectedWhale.height * 1.01, this.selectedWhale.height * 1.5);
        
        // 短暂延迟后，进入下一个动画状态
        if (!this.worldEnterStartTime) {
            this.worldEnterStartTime = Date.now();
        }
        
        if (Date.now() - this.worldEnterStartTime > 1000) {
            this.animationState = 'starsAppearing';
            this.worldEnterStartTime = null;
            this.generateStars();
        }
    }
    
    // 生成星星用于动画
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            // 在选中的世界周围创建星星
            const angle = Math.random() * Math.PI * 2;
            const distance = this.selectedWorld.size/2 + 20 + Math.random() * 150;
            
            this.stars.push({
                x: this.selectedWorld.x + Math.cos(angle) * distance,
                y: this.selectedWorld.y + Math.sin(angle) * distance,
                size: 1 + Math.random() * 3,
                opacity: 0,
                maxOpacity: 0.2 + Math.random() * .8
            });
        }
        
        // 重置鲸鱼为下一个动画
        this.selectedWhale = {
            x: this.selectedWorld.x,
            y: this.selectedWorld.y,
            width: 10,
            height: 5,
            type: this.selectedWhale.type,
            rotation: this.selectedWhale.rotation
        };
    }
    
    // 动画：星星出现
    animateStarsAppearing() {
        // 淡入星星
        let allStarsVisible = true;
        this.stars.forEach(star => {
            if (star.opacity < star.maxOpacity) {
                star.opacity += 0.02;
                allStarsVisible = false;
            }
        });
        
        // 当所有星星都可见时，进入下一个动画状态
        if (allStarsVisible) {
            this.animationState = 'whaleToStars';
        }
    }
    
    // 动画：鲸鱼飞向星星
    animateWhaleToStars() {
        // 选择一个随机星星飞向
        if (!this.targetStar) {
            this.targetStar = this.stars[Math.floor(Math.random() * this.stars.length)];
        }
        
        // 计算朝星星的方向
        const dx = this.targetStar.x - this.selectedWhale.x;
        const dy = this.targetStar.y - this.selectedWhale.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 移动鲸鱼朝向星星
        if (distance > 5) {
            this.selectedWhale.x += dx * 0.05;
            this.selectedWhale.y += dy * 0.05;
            
            // 调整鲸鱼朝向
            if (dx > 0 && this.selectedWhale.rotation !== 0) {
                this.selectedWhale.rotation = 0; // 右转
            } else if (dx < 0 && this.selectedWhale.rotation !== Math.PI) {
                this.selectedWhale.rotation = Math.PI; // 左转
            }
            
            // 让鲸鱼稍微变大
            this.selectedWhale.width = Math.min(this.selectedWhale.width + 0.1, 30);
            this.selectedWhale.height = Math.min(this.selectedWhale.height + 0.05, 15);
        } else {
            // 到达星星，进入下一个动画状态
            this.animationState = 'lightFlash';
            this.flashStart = Date.now();
            
            // 根据奖品类型确定闪光颜色
            if (this.prizeToReveal.prizeType === 'first' || this.prizeToReveal.prizeType === 'special') {
                this.flashColor = 'gold';
            } else {
                this.flashColor = 'purple';
            }
        }
    }
    
    // 动画：光闪效果
    animateLightFlash() {
        const flashDuration = 2500;
        const elapsed = Date.now() - this.flashStart;
        const progress = Math.min(elapsed / flashDuration, 1);
        
        // 获取中心点坐标
        const centerX = this.worldsCenter.x;
        const centerY = this.worldsCenter.y;
        
        // 计算光效半径
        const maxRadius = Math.sqrt(Math.pow(this.canvas.width, 2) + Math.pow(this.canvas.height, 2));
        
        // 光效半径增长曲线
        let radius;
        if (progress < 0.4) {
            radius = maxRadius * (progress / 0.3);
        } else if (progress < 0.7) {
            radius = maxRadius * (1.0 + 0.05 * Math.sin(progress * 15)); // 轻微脉冲
        } else {
            radius = maxRadius * (1 - (progress - 0.7) / 0.3);
        }
        radius = Math.max(0.1, radius);
        
        // 不透明度曲线
        let opacity;
        if (progress < 0.4) {
            opacity = progress * 2.5;
        } else if (progress < 0.7) {
            opacity = 1.0 + 0.15 * Math.sin(progress * 20);
        } else {
            opacity = 1.0 - (progress - 0.7) / 0.3;
        }
        opacity = Math.min(Math.max(0, opacity), 1.0);
        
        this.ctx.save();
        
        // 背景模糊光晕层
        if (this.flashColor === 'gold') {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.15)'; // 金色
        } else if (this.flashColor === 'blue') {
            this.ctx.fillStyle = 'rgba(30, 144, 255, 0.15)'; // 蓝色
        } else {
            this.ctx.fillStyle = 'rgba(128, 0, 255, 0.15)'; // 紫色
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        try {
            // 主光效 - 使用多层渐变增强效果
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, radius
            );
            
            // 设置更柔和的渐变过渡
            const baseColor = this.flashColor || 'gold';
            let brightColor;
            if (this.flashColor === 'gold') {
                brightColor = 'rgba(255, 255, 200, 1.0)'; // 金色亮部
            } else if (this.flashColor === 'blue') {
                brightColor = 'rgba(100, 200, 255, 1.0)'; // 蓝色亮部
            } else {
                brightColor = 'rgba(200, 100, 255, 1.0)'; // 紫色亮部
            }
            
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(0.1, brightColor);
            gradient.addColorStop(0.4, baseColor);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            // 绘制主光效
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = opacity;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 增强的中心光晕 - 更大更柔和
            const glowSize = 200 + 250 * Math.sin(progress * Math.PI);
            const glowGradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, glowSize
            );
            
            glowGradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            if (this.flashColor === 'gold') {
                glowGradient.addColorStop(0.2, 'rgba(255, 255, 180, 0.9)'); // 金色光晕
            } else if (this.flashColor === 'blue') {
                glowGradient.addColorStop(0.2, 'rgba(180, 220, 255, 0.9)'); // 蓝色光晕
            } else {
                glowGradient.addColorStop(0.2, 'rgba(220, 180, 255, 0.9)'); // 紫色光晕
            }
            glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.globalAlpha = 0.9 * (1 - progress * 0.7);
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 替换射线效果为柔和的光晕波纹
            if (progress < 0.6) {
                const waveCount = 3;
                const maxWaveRadius = radius * 0.7 * progress;
                
                for (let i = 0; i < waveCount; i++) {
                    const waveProgress = (progress + i/waveCount) % 1.0;
                    const waveRadius = maxWaveRadius * waveProgress;
                    const waveOpacity = 0.4 * (1 - waveProgress);
                    
                    const waveGradient = this.ctx.createRadialGradient(
                        centerX, centerY, waveRadius * 0.8,
                        centerX, centerY, waveRadius
                    );
                    
                    waveGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
                    waveGradient.addColorStop(0.5, `rgba(255, 255, 255, ${waveOpacity * 0.5})`);
                    waveGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
                    
                    this.ctx.globalAlpha = waveOpacity;
                    this.ctx.fillStyle = waveGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        } catch (e) {
            console.error("渐变绘制错误:", e);
        }
        
        this.ctx.restore();
        
        // 当光效完成时，转到揭示状态
        if (progress >= 0.999 || elapsed >= flashDuration) {
            this.animationState = 'revealing';
            this.revealProgress = 0;
            this.revealStart = Date.now();
        }
    }
    

    // 揭示奖品
    revealPrize() {
        const revealDuration = 2000;
        const elapsed = Date.now() - this.revealStart;
        const progress = Math.min(elapsed / revealDuration, 1);
        
        // 为奖品揭示清除中间区域
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(
            this.canvas.width * 0.15,
            this.canvas.height * 0.1,
            this.canvas.width * 0.7,
            this.canvas.height * 0.8
        );
        
        // 设置文本样式
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 如果是批量抽奖（二等奖或三等奖）
        if (this.prizeToReveal.allPrizes) {
            const prizes = this.prizeToReveal.allPrizes;
            const currentBatch = this.prizeToReveal.currentBatch;
            const totalBatches = this.prizeToReveal.totalBatches;
            
            if (this.prizeToReveal.prizeType === 'second'){
                // 绘制奖品类型与批次信息
                this.ctx.font = '46px "Microsoft YaHei", "PingFang SC", sans-serif';
                this.ctx.fillText(`二等奖 (${currentBatch}/${totalBatches})`, this.canvas.width / 2, this.canvas.height * 0.15);
    
                // 显示获奖数量
                this.ctx.font = '30px "Microsoft YaHei", "PingFang SC", sans-serif';
                this.ctx.fillText(
                    `本批次 ${prizes.length} 个`,
                    this.canvas.width / 2,
                    this.canvas.height * 0.22
                );
    
                // 使用2列布局，保持单行显示
                const columnCount = 2;
                const itemsPerColumn = Math.ceil(prizes.length / columnCount);
                
                // 设置2列的位置
                const columnPositions = [
                    this.canvas.width * 0.35,  // 左列
                    this.canvas.width * 0.65   // 右列
                ];
                
                // 绘制每列中奖号码
                this.ctx.font = '28px "Microsoft YaHei", "PingFang SC", sans-serif';
                const lineHeight = this.canvas.height * 0.15;
                const startY = this.canvas.height * 0.3;
                
                for (let col = 0; col < columnCount; col++) {
                    const startX = columnPositions[col];
                    
                    for (let i = 0; i < itemsPerColumn && col * itemsPerColumn + i < prizes.length; i++) {
                        const prizeIndex = col * itemsPerColumn + i;
                        const prize = prizes[prizeIndex];
                        
                        // 为每个奖项添加轻微发光效果
                        this.ctx.shadowColor = 'rgba(128, 0, 255, 0.5)';
                        this.ctx.shadowBlur = 10;
                        
                        // 单行显示奖项内容
                        this.ctx.fillText(
                            `${prize.world}-${prize.whale}-${prize.celestialBody}`,
                            startX,
                            startY + i * lineHeight
                        );
                        
                        // 重置阴影
                        this.ctx.shadowBlur = 0;
                    }
                }
                
                // 添加继续提示（如果不是最后一批）
                if (currentBatch < totalBatches) {
                    this.ctx.font = '28px "Microsoft YaHei", "PingFang SC", sans-serif';
                    this.ctx.fillText('点击继续查看下一批', this.canvas.width / 2, this.canvas.height * 0.85);
                }
            } else {
                // 三等奖显示
                this.ctx.font = '42px "Microsoft YaHei", "PingFang SC", sans-serif';
                this.ctx.fillText(`三等奖 (${currentBatch}/${totalBatches})`, this.canvas.width / 2, this.canvas.height * 0.15);
                
                // 显示获奖数量
                this.ctx.font = '28px "Microsoft YaHei", "PingFang SC", sans-serif';
                this.ctx.fillText(
                    `本批次 ${prizes.length} 个`,
                    this.canvas.width / 2,
                    this.canvas.height * 0.2
                );
                
                // 创建三列布局
                const columnCount = 3;
                const itemsPerColumn = Math.ceil(prizes.length / columnCount);
                
                // 设置三列的位置
                const columnPositions = [
                    this.canvas.width * 0.3,
                    this.canvas.width * 0.5,
                    this.canvas.width * 0.7
                ];
                
                // 单行显示奖项
                this.ctx.font = '24px "Microsoft YaHei", "PingFang SC", sans-serif';
                const lineHeight = this.canvas.height * 0.1;
                const startY = this.canvas.height * 0.28;
                
                for (let col = 0; col < columnCount; col++) {
                    const startX = columnPositions[col];
                    
                    for (let i = 0; i < itemsPerColumn && col * itemsPerColumn + i < prizes.length; i++) {
                        const prizeIndex = col * itemsPerColumn + i;
                        const prize = prizes[prizeIndex];
                        
                        // 添加微弱的发光效果
                        this.ctx.shadowColor = 'rgba(128, 0, 255, 0.3)';
                        this.ctx.shadowBlur = 5;
                        
                        // 单行显示奖项内容
                        this.ctx.fillText(
                            `${prize.world}-${prize.whale}-${prize.celestialBody}`,
                            startX,
                            startY + i * lineHeight
                        );
                        
                        // 重置阴影
                        this.ctx.shadowBlur = 0;
                    }
                }
                
                // 添加继续提示（如果不是最后一批）
                if (currentBatch < totalBatches) {
                    this.ctx.font = '28px "Microsoft YaHei", "PingFang SC", sans-serif';
                    this.ctx.fillText('点击继续查看下一批', this.canvas.width / 2, this.canvas.height * 0.85);
                }
            }
        } else {
            // 单个奖项抽取（一等奖/特等奖）- 改为三行显示
            
            // 绘制奖品类型
            this.ctx.font = '40px "Microsoft YaHei", "PingFang SC", sans-serif';
            const prizeTypeText = this.prizeToReveal.prizeType === 'special' ? '特等奖' : '一等奖';
            
            // 添加抽取次数显示
            if (this.prizeToReveal.drawCount) {
                this.ctx.fillText(`${prizeTypeText} (第${this.prizeToReveal.drawCount}次抽取)`, 
                    this.canvas.width / 2, this.canvas.height * 0.3);
            } else {
                this.ctx.fillText(prizeTypeText, this.canvas.width / 2, this.canvas.height * 0.3);
            }
            
            // 使用三行格式显示奖品代码
            // 第一行：世界/星系
            this.ctx.font = '54px "Microsoft YaHei", "PingFang SC", sans-serif';
            this.ctx.fillText(
                this.prizeToReveal.world,
                this.canvas.width / 2,
                this.canvas.height * 0.45
            );
            
            // 第二行：鲸鱼名称
            this.ctx.font = '44px "Microsoft YaHei", "PingFang SC", sans-serif';
            this.ctx.fillText(
                this.prizeToReveal.whale,
                this.canvas.width / 2,
                this.canvas.height * 0.55
            );
            
            // 第三行：星体编号
            this.ctx.font = '54px "Microsoft YaHei", "PingFang SC", sans-serif';
            this.ctx.fillText(
                this.prizeToReveal.celestialBody,
                this.canvas.width / 2,
                this.canvas.height * 0.65
            );
            
        }
    }
    
    // 重置到空闲状态
    reset() {
        this.animationState = 'idle';
        this.selectedWhale = null;
        this.targetStar = null;
        this.stars = [];
        this.pathPoints = null;
        this.pathIndex = 0;
        this.worldEnterStartTime = null;
        this.whalesInitialized = false; // 重置这个标志，确保新鲸鱼获得波动参数
        
        // 重置世界大小（但保持位置不变）
        this.worlds.forEach(world => {
            world.size = world.originalSize;
        });
        
        // 只重新初始化鲸鱼，不重新初始化世界
        this.initWhales();
        
        // 注意：不重置worldsCenter，保持中心点位置
    }
}

export default AnimationController;