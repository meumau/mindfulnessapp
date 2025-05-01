let config = {
    type: Phaser.AUTO,
    width: 900,
    height: 550,
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
let entityName;

//peli hakee pisteet localStoragesta, jos niitä ei löydy, asetetaan ne nollaksi
localStorage.getItem("points") ? points = parseInt(localStorage.getItem("points"), 10) : points = 0;

let infoText;

let mindversumText;

//peli hakee mindversum-pisteet ja entityjen määrän localStoragesta, jos niitä ei löydy, asetetaan ne nollaksi
localStorage.getItem("mindversumPoints") ? mindversumPoints = parseInt(localStorage.getItem("mindversumPoints"), 10) : mindversumPoints = 0;
localStorage.getItem("entityCount") ? entityCount = parseInt(localStorage.getItem("entityCount"), 10) : entityCount = 0;    

let flyingThought;

let timerText;
let timer;

//tätä muuttujaa käytetään ajastimen tilan tarkistamiseen ja hahmon liikkeen estämiseen ajastimen aikana
let ongoingTask = false;

let pointsToAdd = 0;

//musiikkisoitin
let music = document.getElementById('musicPlayer');


function preload ()
{
    //nimet

    this.load.json('names', 'names.json');

    //kuvat

    this.load.image('topBlock', 'assets/topblock.png');
    this.load.image('note', 'assets/note.png');
    this.load.image('bg', 'assets/background.png');
    this.load.image('block1', 'assets/block1.png');
    this.load.image('block2', 'assets/block2.png');
    this.load.image('block3', 'assets/block3.png');
    this.load.image('ground', 'assets/ground.png');
    this.load.image('cloudmachine', 'assets/thoughtmachine.png');
    this.load.image('fridge', 'assets/fridge.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('mindversum', 'assets/mindfulverse.png');
    this.load.spritesheet('entity', 
    'assets/entity.png',
    { frameWidth: 32, frameHeight: 27 }
);
}

function create ()
{
    //hahmon nimen määritys
        
    //arvotaan satunnainen nimi, jos localStoragessa ei ole jo nimeä
    if (!localStorage.getItem("entityName")) {
    generateName();
    }

    //haetaan nimi localStoragesta
    entityName = localStorage.getItem("entityName");
    

    //maailman luonti

    this.add.image(450, 300, 'bg');

    platforms = this.physics.add.staticGroup();

    platforms.create(450, 525, 'ground').refreshBody();

    platforms.create(560, 400, 'block3');
    platforms.create(100, 200, 'block2');
    platforms.create(800, 250, 'block2');
    platforms.create(360, 300, 'block1');
    platforms.create(860, 420, 'block2');
    platforms.create(530, 150, 'block3');
    platforms.create(120, 430, 'block3');

    
    platforms.create(450, 20, 'topBlock');


    //hahmo

    entity = this.physics.add.sprite(250, 300, 'entity');

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

    //infolaatikon piilotus napilla
    document.getElementById("ok").addEventListener("click", function() {
        document.getElementById("infoBox").style.display = "none";
    });


    //ajatuspilvi-kone

    cloudmachine = this.physics.add.sprite(360, 269, 'cloudmachine');
    cloudmachine.setImmovable(true);
    cloudmachine.body.allowGravity = false;

    this.physics.add.collider(entity, cloudmachine, useCloudMachine, null, this);


    //puu

    tree = this.physics.add.sprite(800, 175, 'tree');
    tree.setImmovable(true);
    tree.body.allowGravity = false;

    this.physics.add.collider(entity, tree, useTree, null, this);

    //puun ajastin

    timerText = this.add.text(780, -22, '', { fontSize: '20px', fill: '#393743', fontFamily: 'monospace', align: 'center' });

    //puun nappien toiminta ja ajastimen käynnistys

    document.getElementById("oneMin").addEventListener("click", () => startTimer.call(this, 60));
    document.getElementById("fiveMin").addEventListener("click", () => startTimer.call(this, 300));
    document.getElementById("tenMin").addEventListener("click", () => startTimer.call(this, 600));
    document.getElementById("close").addEventListener("click", closeTreeView);
    
    //jääkaappi

    fridge = this.physics.add.sprite(820, 384, 'fridge');
    fridge.setImmovable(true);
    fridge.body.allowGravity = false;

    this.physics.add.collider(entity, fridge, useFridge, null, this);

    //jääkaapin nappien toiminta

    document.getElementById("food1").addEventListener("click", closeFridge);
    document.getElementById("food2").addEventListener("click", closeFridge);
    document.getElementById("food3").addEventListener("click", closeFridge);

    //mindversum

    mindversum = this.physics.add.sprite(80, 154, 'mindversum');
    mindversum.setImmovable(true);
    mindversum.body.allowGravity = false;

    this.physics.add.collider(entity, mindversum, useMindversum, null, this);

    //mindversum-koneen nappien toiminta

    document.getElementById("yes").addEventListener("click", goToMindversum);
    document.getElementById("no").addEventListener("click", closeMindversum);

    //hahmon tiedot

    infoText = this.add.text(16, 437, 'Mindfulness points: ' + points + "  Entity's name: " + entityName, { fontSize: '16px', fill: '#f0e2f9', fontFamily: 'monospace' });

    //mindversumin tiedot

    mindversumText = this.add.text(16, -73, 'Entities in mindversum: ' + entityCount + "  Points in mindversum: " + mindversumPoints, { fontSize: '16px', fill: '#393743', fontFamily: 'monospace' });

    //musiikin säätely
    
    let musicButton = this.add.image(870, 20, 'note').setInteractive(); 
    let isPlaying = true;

    musicButton.on('pointerdown', function () {
        if (isPlaying) {
            music.pause();
        } else {
            music.play();
        }
        isPlaying = !isPlaying;
    });
}

//ajatuspilvi-koneen käyttö

function useCloudMachine() {

    if (entity.body.touching.left || entity.body.touching.right) {

        //ajatuspilvi-koneen infon näyttäminen
        let thoughtInfo = document.getElementById("thoughtInfo");
        thoughtInfo.style.display = "block"; 

        //input-kentän näyttäminen
        let inputField = document.getElementById("thoughtInput");
        inputField.style.display = "block";
        inputField.focus(); 

        ongoingTask = true; 

    }

}

//ajatuspilvi-koneen inputin käsittely

function handleThoughtInput(event) {
    //jos käytetty näppäin ei ole Enter, ei tehdä mitään
    if (event.key !== "Enter") return;

    //muuten:

    const userThought = event.target.value;
    const scene = game.scene.scenes[0]; 

    //leijaileva ajatus
    const flyingThought = scene.add.text(360, 200, userThought, {
        fontSize: '24px',
        fill: '#000',
        fontFamily: 'monospace',
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
    infoText.setText("Mindfulness points: " + points + "  Entity's name: " + entityName);
    localStorage.setItem("points", points); // tallennetaan pisteet localStorageen

    ongoingTask = false; 

}

//rauhoittumispuun käyttö

function useTree() {

    if (entity.body.touching.left || entity.body.touching.right) {
    //näytetään rauhoittumispuun elementit
    let treeUse = document.getElementById("treeInfo");
    treeUse.style.display = "block"; 
    }

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

    ongoingTask = true; //ajastin on aktiivinen

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

    //kun aika loppuu, näytetään Done teksti ja lisätään mindfulness-pisteitä
    if (this.initialTime <= 0 && this.initialTime > -5) {
        timerText.setText('Done'); //piilotetaan ajastin
        points += pointsToAdd; //lisätään mindfulness-pisteitä
        infoText.setText("Mindfulness points: " + points + "  Entity's name: " + entityName);
        localStorage.setItem("points", points); // tallennetaan pisteet localStorageen
        ongoingTask = false; //ajastin ei ole enää aktiivinen
    }

    //kun ajastin on -5 sekuntia, piilotetaan done-teksti
    if (this.initialTime <= -5) {
        timerText.setText(''); 
        timer.remove(); //poistetaan ajastin
    }
}

//valintanappien poistuminen näkyvistä
function closeTreeView() {
    document.getElementById("treeInfo").style.display = "none";
}


//jääkaapin käyttö

function useFridge() {

    if (entity.body.touching.left || entity.body.touching.right) {
    let fridgeInfo = document.getElementById("fridgeInfo");
    fridgeInfo.style.display = "block"; 

    ongoingTask = true; 
    }

}


//valintanappien poistuminen näkyvistä
function closeFridge() {

    points += 10; //lisätään mindfulness-pisteitä
    infoText.setText("Mindfulness points: " + points + "  Entity's name: " + entityName);
    localStorage.setItem("points", points); // tallennetaan pisteet localStorageen

    document.getElementById("fridgeInfo").style.display = "none";

    ongoingTask = false; 


}

//mindversum-koneen käyttö
function useMindversum() {

    if (entity.body.touching.left || entity.body.touching.right) {
    //näytetään mindversum-koneen elementit
    document.getElementById("mindversumInfo").style.display = "block";

    ongoingTask = true; 
    }

}

//mindversumiin siirtyminen
function goToMindversum() {

//elementtien piilotus
closeMindversum();

const scene = game.scene.scenes[0];

//mindversumiin siirtymisen ja "uuden hahmon" luomisen animaatio
 scene.tweens.add({
    targets: entity,
    y: entity.y - 150,
    x: entity.x + 140,
    alpha: 0,           
    duration: 4000,     
    ease: 'Sine.easeOut',
    onComplete: function () {

        entity.setAlpha(1);             
        entity.setY(0);                   

        scene.tweens.add({
            targets: entity,
            y: scene.sys.game.config.height - 100,  
            duration: 1000,                     
            ease: 'Sine.easeIn',
            onComplete:newEntity ()
        });
    }
});

ongoingTask = false; 

}

//mindversumpisteiden ja entityjen määrän lisääminen ja uuden hahmon tietojen määrittely
function newEntity() {
    mindversumPoints += points; //lisätään mindversum-pisteitä
    entityCount += 1; //lisätään entityjen määrää
    mindversumText.setText("Entities in mindversum: " + entityCount + "  Points in mindversum: " + mindversumPoints);
    localStorage.setItem("mindversumPoints", mindversumPoints); // tallennetaan mindversum-pisteet localStorageen
    localStorage.setItem("entityCount", entityCount); // tallennetaan entityjen määrä localStorageen

    points = 0; //nollataan pisteet

    generateName(); //luodaan uusi nimi
    
    infoText.setText("Mindfulness points: " + points + "  Entity's name: " + entityName);
    localStorage.setItem("points", points); // tallennetaan pisteet localStorageen

}


//mindversum-koneen valintanappien poistuminen näkyvistä
function closeMindversum() {
    document.getElementById("mindversumInfo").style.display = "none";
    ongoingTask = false; 

}

//generoidaan uusi nimi
function generateName() {

    const scene = game.scene.scenes[0];
    //haetaan nimet
    const names = scene.cache.json.get('names');
    //arvotaan nimi    
    entityName = names[Math.floor(Math.random() * names.length)];
    localStorage.setItem("entityName", entityName); // tallennetaan uusi nimi localStorageen

}



//liikkuminen

function update ()
{
    if (ongoingTask) {
        entity.setVelocityX(0); //pysäytetään hahmon liike
        entity.anims.play('turn'); //asetetaan hahmo paikalleen
        return; 
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
        entity.setVelocityY(-260);
    }
}
