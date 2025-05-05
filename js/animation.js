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
        // 创建世界对象 - 水平等间距，垂直有规律变化
        this.worlds = [];
        const worldCount = lotteryData.worlds.length;
        
        // 减少边距，使星系可以更接近屏幕边缘
        const horizontalPadding = this.canvas.width * 0.08;
        const availableWidth = this.canvas.width - (horizontalPadding * 2);
        
        // 垂直位置基准线和变化幅度
        const baseY = this.canvas.height * 0.6; // 基准高度
        const yAmplitude = this.canvas.height * 0.15; // 垂直变化幅度
        
        for (let i = 0; i < worldCount; i++) {
            const world = lotteryData.worlds[i];
            const worldImg = this.images[`world_${i}`];
            
            // 保持大尺寸星系
            const worldSize = 150 + (i * 25); // 使尺寸按顺序有变化
            
            // 计算水平位置 - 等距分布
            let xPosition;
            if (worldCount === 1) {
                // 如果只有一个星系，居中显示
                xPosition = this.canvas.width / 2;
            } else {
                // 否则等距分布，最大化间隔
                xPosition = horizontalPadding + (availableWidth * i / (worldCount - 1));
            }
            
            // 使用正弦函数计算垂直位置，创建波浪形分布
            // 三个星系将形成高-低-高 或 低-高-低 的分布
            const yOffset = Math.sin((i / (worldCount - 1)) * Math.PI) * yAmplitude;
            
            this.worlds.push({
                x: xPosition,
                y: baseY + yOffset, // 基准高度加上偏移
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
        for (let i = 0; i < 20; i++) {
            const whaleTypeIndex = Math.floor(Math.random() * lotteryData.whales.length);
            const whaleImg = this.images[`whale_${whaleTypeIndex}`];
            
            const aspectRatio = whaleImg ? whaleImg.width / whaleImg.height : 2;
            const whaleHeight = 50 + Math.random() * 30;
            const whaleWidth = whaleHeight * aspectRatio;
            
            this.whales.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height / 2),
                speedX: (Math.random() - 0.5) * 3.5, // 增加速度
                speedY: (Math.random() - 0.5) * 2,   // 增加速度
                width: whaleWidth,
                height: whaleHeight,
                type: whaleTypeIndex,
                rotation: Math.random() > 0.5 ? 0 : Math.PI,
                name: lotteryData.whales[whaleTypeIndex].name
            });
        }
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
        this.whales.forEach(whale => {
            // 更新位置
            whale.x += whale.speedX * (whale.rotation === 0 ? 1 : -1); // 根据朝向调整方向
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
                
                // 为选中的鲸鱼添加发光效果
                if (this.animationState === 'drawing') {
                    this.ctx.shadowColor = 'white';
                    this.ctx.shadowBlur = 20;
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
                
                // 添加星系标识符
                // this.ctx.fillStyle = 'white';
                // this.ctx.font = '24px Arial';
                // this.ctx.textAlign = 'center';
                // this.ctx.fillText(world.id, world.x, world.y + world.size/2 + 30);
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
    
    // // 开始抽奖动画
    
    // Update the startDrawing method to decouple the prize from the whale's destination
    // 开始抽奖动画
    startDrawing(prize) {
        this.animationState = 'drawing';
        this.stars = [];
        
        // 存储奖品，与目的地无关
        this.prizeToReveal = prize;
        
        // 选择一个随机世界作为目的地（与奖品无关）
        const randomWorldIndex = Math.floor(Math.random() * this.worlds.length);
        this.selectedWorld = this.worlds[randomWorldIndex];
        
        // 选择一只随机鲸鱼
        if (this.whales.length === 0) {
            this.initWhales();
        }
        
        const whaleIndex = Math.floor(Math.random() * this.whales.length);
        this.selectedWhale = this.whales[whaleIndex];
        
        // 从常规数组中移除选中的鲸鱼
        this.whales.splice(whaleIndex, 1);
        
        // 调整鲸鱼朝向选中的世界
        if (this.selectedWhale.x > this.selectedWorld.x) {
            this.selectedWhale.rotation = Math.PI; // 左转
        } else {
            this.selectedWhale.rotation = 0; // 右转
        }
        
        // 为曲线移动生成路径点
        this.pathPoints = this.generateCurvedPath(
            this.selectedWhale.x, 
            this.selectedWhale.y,
            this.selectedWorld.x,
            this.selectedWorld.y
        );
        this.pathIndex = 0;
        
        // 设置超时进入下一个动画状态
        setTimeout(() => {
            this.animationState = 'whaleMoving';
        }, 1000);
    }
    generateCurvedPath(startX, startY, endX, endY) {
        const points = [];
        const numPoints = 100;
        
        // 增加随机性和曲线的幅度
        const amplitude = Math.min(this.canvas.width, this.canvas.height) * 0.3; // 增大振幅
        
        // 创建两个控制点而不是一个，形成三次贝塞尔曲线
        const controlPoint1X = (startX + endX) / 2 + (Math.random() - 0.5) * amplitude;
        const controlPoint1Y = startY - Math.random() * amplitude; // 控制点向上偏移
        
        const controlPoint2X = (startX + endX) / 2 + (Math.random() - 0.5) * amplitude;
        const controlPoint2Y = endY - Math.random() * amplitude * 0.7; // 第二控制点也向上偏移
        
        // 生成三次贝塞尔曲线
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            
            // 三次贝塞尔曲线公式
            const x = Math.pow(1-t, 3) * startX + 
                      3 * Math.pow(1-t, 2) * t * controlPoint1X + 
                      3 * (1-t) * Math.pow(t, 2) * controlPoint2X + 
                      Math.pow(t, 3) * endX;
                      
            const y = Math.pow(1-t, 3) * startY + 
                      3 * Math.pow(1-t, 2) * t * controlPoint1Y + 
                      3 * (1-t) * Math.pow(t, 2) * controlPoint2Y + 
                      Math.pow(t, 3) * endY;
            
            // 添加小波动使路径更自然
            const waveAmplitude = 5 + Math.random() * 5;
            const waveFrequency = 0.1 + Math.random() * 0.1;
            const wave = Math.sin(t * Math.PI * 10 * waveFrequency) * waveAmplitude;
            
            points.push({
                x: x + wave,
                y: y + wave * 0.5
            });
        }
        
        return points;
    }
    // 动画：鲸鱼选择
    animateWhaleSelection() {
        // 让选中的鲸鱼搏动
        const pulseScale = 1 + 0.1 * Math.sin(Date.now() / 100);
        const originalWidth = this.selectedWhale.width / pulseScale;
        const originalHeight = this.selectedWhale.height / pulseScale;
        
        this.selectedWhale.width = originalWidth * pulseScale;
        this.selectedWhale.height = originalHeight * pulseScale;
        
        // 在鲸鱼周围绘制高亮
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.selectedWhale.x, 
            this.selectedWhale.y, 
            this.selectedWhale.width/2 + 10, 
            this.selectedWhale.height/2 + 10, 
            0, 0, Math.PI * 2
        );
        this.ctx.stroke();
    }
    generateCurvedPath(startX, startY, endX, endY) {
        const points = [];
        const numPoints = 100;
        const controlPointX = (startX + endX) / 2 + (Math.random() - 0.5) * 300;
        const controlPointY = (startY + endY) / 2 + (Math.random() - 0.5) * 200;
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            // Quadratic Bezier curve formula
            const x = (1-t)*(1-t)*startX + 2*(1-t)*t*controlPointX + t*t*endX;
            const y = (1-t)*(1-t)*startY + 2*(1-t)*t*controlPointY + t*t*endY;
            points.push({x, y});
        }
        
        return points;
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
            
            // 计算到目标的剩余距离百分比
            const progressAlongPath = this.pathIndex / (this.pathPoints.length - 1);
            
            // 当鲸鱼完成路径的85%时，直接跳到光幕闪烁阶段
            if (progressAlongPath > 0.85) {
                // 根据奖品类型确定闪光颜色
                const flashColor = (this.prizeToReveal.prizeType === 'first' || 
                                this.prizeToReveal.prizeType === 'special') ? 
                                'gold' : 'purple';
                
                // 直接跳转到光幕闪烁阶段
                this.animationState = 'lightFlash';
                this.flashStart = Date.now();
                this.flashColor = flashColor;
            }
        } else {
            // 到达目的地，进入光闪效果
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
        const flashDuration = 2500; // Increased from 1500
        const elapsed = Date.now() - this.flashStart;
        const progress = Math.min(elapsed / flashDuration, 1);
        
        // First increase, then fade out
        let opacity;
        if (progress < 0.6) { // Extended bright phase
            opacity = progress * 1.6;
        } else {
            opacity = 4 - progress * 4; // Slower fade out
        }
        
        // Draw flash effect with higher opacity
        this.ctx.fillStyle = `${this.flashColor}`;
        this.ctx.globalAlpha = Math.min(opacity * 0.9, 0.9); // Brighter (max 0.9)
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1;
        
        // When flash completes, move to reveal state
        if (progress >= 1) {
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
        this.ctx.fillStyle = this.flashColor === 'gold' ? 'gold' : 'mediumpurple';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 如果是批量抽奖（二等奖或三等奖）
        if (this.prizeToReveal.allPrizes) {
            const prizes = this.prizeToReveal.allPrizes;
            const currentBatch = this.prizeToReveal.currentBatch;
            const totalBatches = this.prizeToReveal.totalBatches;
            
            if (this.prizeToReveal.prizeType === 'second'){
                // 绘制奖品类型与批次信息
                this.ctx.font = '46px Arial';
                this.ctx.fillText(`二等奖 (${currentBatch}/${totalBatches})`, this.canvas.width / 2, this.canvas.height * 0.15);

                // 显示获奖数量
                this.ctx.font = '30px Arial';
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
                this.ctx.font = '28px Arial';
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
                    this.ctx.font = '28px Arial';
                    this.ctx.fillText('点击继续查看下一批', this.canvas.width / 2, this.canvas.height * 0.85);
                }
            } else {
                // 三等奖显示
                this.ctx.font = '42px Arial';
                this.ctx.fillText(`三等奖 (${currentBatch}/${totalBatches})`, this.canvas.width / 2, this.canvas.height * 0.15);
                
                // 显示获奖数量
                this.ctx.font = '28px Arial';
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
                this.ctx.font = '24px Arial';
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
                    this.ctx.font = '28px Arial';
                    this.ctx.fillText('点击继续查看下一批', this.canvas.width / 2, this.canvas.height * 0.85);
                }
            }
        } else {
            // 单个奖项抽取（一等奖/特等奖）- 改为三行显示
            
            // 绘制奖品类型
            this.ctx.font = '40px Arial';
            const prizeTypeText = this.prizeToReveal.prizeType === 'special' ? '特等奖' : '一等奖';
            this.ctx.fillText(prizeTypeText, this.canvas.width / 2, this.canvas.height * 0.3);
            
            // 使用三行格式显示奖品代码
            // 第一行：世界/星系
            this.ctx.font = '54px Arial';
            this.ctx.fillText(
                this.prizeToReveal.world,
                this.canvas.width / 2,
                this.canvas.height * 0.45
            );
            
            // 第二行：鲸鱼名称
            this.ctx.font = '44px Arial';
            this.ctx.fillText(
                this.prizeToReveal.whale,
                this.canvas.width / 2,
                this.canvas.height * 0.55
            );
            
            // 第三行：星体编号
            this.ctx.font = '54px Arial';
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
        this.selectedWorld = null;
        this.targetStar = null;
        this.stars = [];
        this.pathPoints = null;
        this.pathIndex = 0;
        this.worldEnterStartTime = null;
        
        // 重置世界大小（但保持位置不变）
        this.worlds.forEach(world => {
            world.size = world.originalSize;
        });
        
        // 只重新初始化鲸鱼，不重新初始化世界
        this.initWhales();
    }
}

export default AnimationController;