let config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

//muuttujat

let game = new Phaser.Game(config);

let entity;
let entityName = "Dora";

let points = 0;
let infoText;

let flyingThought;

let timerText;
let timer;

//tätä muuttujaa käytetään ajastimen tilan tarkistamiseen ja hahmon liikkeen estämiseen ajastimen aikana
let isTimerActive = false;

let pointsToAdd = 0;


function preload ()
{
    //kuvat

    this.load.image('bg', 'assets/blank-bg.png');
    this.load.image('platform', 'assets/blank-platform.png');
    this.load.image('ground', 'assets/blank-ground.png');
    this.load.image('cloudmachine', 'assets/box1.png');
    this.load.image('fridge', 'assets/box2.png');
    this.load.image('tree', 'assets/box3.png');
    this.load.image('mindversum', 'assets/box4.png');
    this.load.spritesheet('entity', 
    'assets/default.png',
    { frameWidth: 32, frameHeight: 30 }
);
}

function create ()
{

    //maailman luonti

    this.add.image(450, 300, 'bg');

    platforms = this.physics.add.staticGroup();

    platforms.create(450, 575, 'ground').refreshBody();

    platforms.create(460, 400, 'platform');
    platforms.create(100, 250, 'platform');
    platforms.create(800, 250, 'platform');

    //hahmo

    entity = this.physics.add.sprite(250, -350, 'entity');

    entity.setBounce(0.2);
    entity.setCollideWorldBounds(true);

    //hahmon animaatiot

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('entity', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'entity', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('entity', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });


    //hahmon ja alustojen toiminta

    this.physics.add.collider(entity, platforms);

    cursors = this.input.keyboard.createCursorKeys();



    //ajatuspilvi-kone

    cloudmachine = this.physics.add.sprite(460, 349, 'cloudmachine');
    cloudmachine.setImmovable(true);
    cloudmachine.body.allowGravity = false;

    this.physics.add.collider(entity, cloudmachine, useCloudMachine, null, this);


    //puu

    tree = this.physics.add.sprite(800, 172, 'tree');
    tree.setImmovable(true);
    tree.body.allowGravity = false;

    this.physics.add.collider(entity, tree, useTree, null, this);

    //puun ajastin

    timerText = this.add.text(400, 32, '', { fontSize: '20px', fill: 'black', fontFamily: 'Arial' });

    //puun nappien toiminta ja ajastimen käynnistys

    document.getElementById("oneMin").addEventListener("click", () => startTimer.call(this, 60));
    document.getElementById("fiveMin").addEventListener("click", () => startTimer.call(this, 300));
    document.getElementById("tenMin").addEventListener("click", () => startTimer.call(this, 600));
    document.getElementById("close").addEventListener("click", closeTreeView);
    
    //jääkaappi

    fridge = this.physics.add.sprite(820, 520, 'fridge');
    fridge.setImmovable(true);
    fridge.body.allowGravity = false;

    this.physics.add.collider(entity,fridge, useFridge, null, this);

    //jääkaapin nappien toiminta

    document.getElementById("food1").addEventListener("click", closeFridge);
    document.getElementById("food2").addEventListener("click", closeFridge);
    document.getElementById("food3").addEventListener("click", closeFridge);

    //mindversum

    mindversum = this.physics.add.sprite(100, 203, 'mindversum');
    mindversum.setImmovable(true);
    mindversum.body.allowGravity = false;

    this.physics.add.collider(mindversum, entity);


    //hahmon tiedot

    infoText = this.add.text(16, 435, 'Mindfulness points: ' + points + " Entity's name: " + entityName, { fontSize: '20px', fill: 'white', fontFamily: 'Arial' });


}

//ajatuspilvi-koneen käyttö

function useCloudMachine(entity, cloudmachine) {

        //ajatuspilvi-koneen infon näyttäminen
        let thoughtInfo = document.getElementById("thoughtInfo");
        thoughtInfo.style.display = "block"; 

        //input-kentän näyttäminen
        let inputField = document.getElementById("thoughtInput");
        inputField.style.display = "block";
        inputField.focus(); 

}

//ajatuspilvi-koneen inputin käsittely

function handleThoughtInput(event) {
    //jos käytetty näppäin ei ole Enter, ei tehdä mitään
    if (event.key !== "Enter") return;

    //muuten:

    const userThought = event.target.value;
    const scene = game.scene.scenes[0]; 

    //leijaileva ajatus
    const flyingThought = scene.add.text(450, 250, userThought, {
        fontSize: '24px',
        fill: '#000',
        fontFamily: 'Arial',
        align: 'center'
    }).setOrigin(0.5);

    scene.tweens.add({
        targets: flyingThought,
        y: flyingThought.y - 200,
        alpha: 0,
        duration: 4000,
        ease: 'Sine.easeOut',
        onComplete: () => flyingThought.destroy()
    });

    //päivitetään tilat ja piilotetaan kenttä
    event.target.value = "";
    event.target.style.display = "none";
    document.getElementById("thoughtInfo").style.display = "none";

    //lisätään mindfulness-pisteitä
    points += 10;
    infoText.setText("Mindfulness points: " + points + " Entity's name:" + entityName);

}

//rauhoittumispuun käyttö

function useTree(entity, tree) {

    //näytetään rauhoittumispuun elementit

    let treeTest = document.getElementById("treeInfo");
    treeTest.style.display = "block"; 

    let button1 = document.getElementById("oneMin");
    button1.style.display = "block"; 

    let button5 = document.getElementById("fiveMin");
    button5.style.display = "block";

    let button10 = document.getElementById("tenMin");
    button10.style.display = "block";

    let buttonClose = document.getElementById("close");
    buttonClose.style.display = "block";
}

//rauhoittumispuun ajastimen toiminta
//ajastimen rakentamisessa hyödynnetty pohjana https://phaser.discourse.group/t/countdown-timer/2471/3 jjcapellan-käyttäjän koodia (joka on muokattu versio Phaserin omasta esimerkistä) ja jatkokehitetty/muokattu ajastimen toimintaa pelin tarpeiden mukaan

//ajan muotoilu
function formatTime(seconds){
    //minuutit
    let minutes = Math.floor(seconds/60);
    //sekuntit
    let partInSeconds = seconds%60;
    //lisätään nollat eteen
    partInSeconds = partInSeconds.toString().padStart(2,'0');
    //palautetaan muotoiltu aika
    return `${minutes}:${partInSeconds}`;
}


//ajastimen käynnistys
function startTimer(seconds) {
    this.initialTime = seconds;
    timerText.setText(formatTime(this.initialTime));
    closeTreeView(); 

    isTimerActive = true; //ajastin on aktiivinen

    //määritellään saatavat pisteet ajastimen ajan mukaan
    if (seconds === 60) {
        pointsToAdd = 20; // 1 minuutti
    } else if (seconds === 300) {
        pointsToAdd = 50; // 5 minuuttia
    } else if (seconds === 600) {
        pointsToAdd = 100; // 10 minuuttia
    }

    //ajastintapahtuma
    timer = this.time.addEvent({
        delay: 1000,
        callback: timerOn, //kutsutaan timerOn-funktiota
        callbackScope: this,
        loop: true
    });
}

//ajastimen toiminta

function timerOn() {
    this.initialTime -= 1; //vähennetään aikaa sekunnilla
    timerText.setText(formatTime(this.initialTime));

    //kun aika loppuu, piilotetaan ajastin ja lisätään mindfulness-pisteitä
    if (this.initialTime <= 0) {
        timerText.setText(''); //piilotetaan ajastin
        timer.remove(); //pysäytetään ajastin
        points += pointsToAdd; //lisätään mindfulness-pisteitä
        infoText.setText("Mindfulness points: " + points + " Entity's name: " + entityName);
        isTimerActive = false; //ajastin ei ole enää aktiivinen
    }
}

//valintanappien poistuminen näkyvistä
function closeTreeView() {

    document.getElementById("treeInfo").style.display = "none";
    document.getElementById("oneMin").style.display = "none";
    document.getElementById("fiveMin").style.display = "none";
    document.getElementById("tenMin").style.display = "none";
    document.getElementById("close").style.display = "none";

}


//jääkaapin käyttö

function useFridge(entity, fridge) {

    let fridgeInfo = document.getElementById("fridgeInfo");
    fridgeInfo.style.display = "block"; 

    let food1 = document.getElementById("food1");
    food1.style.display = "block"; 

    let food2 = document.getElementById("food2");
    food2.style.display = "block"; 

    let food3 = document.getElementById("food3");
    food3.style.display = "block"; 

}


//valintanappien poistuminen näkyvistä
function closeFridge() {

    points += 10; //lisätään mindfulness-pisteitä
    infoText.setText("Mindfulness points: " + points + " Entity's name: " + entityName);

    document.getElementById("fridgeInfo").style.display = "none";
    document.getElementById("food1").style.display = "none";
    document.getElementById("food2").style.display = "none";
    document.getElementById("food3").style.display = "none";

}

//liikkuminen

function update ()
{
    if (isTimerActive) {
        entity.setVelocityX(0); // Pysäytä hahmon liike
        entity.anims.play('turn'); // Aseta hahmo paikalleen
        return; // Lopeta päivitys
    }

    if (cursors.left.isDown)
    {
        entity.setVelocityX(-160);

        entity.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        entity.setVelocityX(160);

        entity.anims.play('right', true);
    }
    else
    {
        entity.setVelocityX(0);

        entity.anims.play('turn');
    }

    if (cursors.up.isDown && entity.body.touching.down)
    {
        entity.setVelocityY(-330);
    }
}
