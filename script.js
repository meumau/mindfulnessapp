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

//entiteetti ja sen nimi
let entity;
let entityName;

//peli hakee pisteet localStoragesta, jos niitä ei löydy, asetetaan ne nollaksi
let points;
localStorage.getItem("points") ? points = parseInt(localStorage.getItem("points"), 10) : points = 0;

//info teksti
let infoText;

//mindversumin statsit
let mindversumText;

//peli hakee mindversum-pisteet ja entityjen määrän localStoragesta, jos niitä ei löydy, asetetaan ne nollaksi
let mindversumPoints;
let entityCount;
localStorage.getItem("mindversumPoints") ? mindversumPoints = parseInt(localStorage.getItem("mindversumPoints"), 10) : mindversumPoints = 0;
localStorage.getItem("entityCount") ? entityCount = parseInt(localStorage.getItem("entityCount"), 10) : entityCount = 0;    

//lentävä ajatus
let flyingThought;

//ajastimen sisältö
let timerText;
let timer;

//tätä muuttujaa käytetään ajastimen tilan tarkistamiseen ja hahmon liikkeen estämiseen ajastimen aikana
let ongoingTask = false;

//muuttuja pisteiden lisäämiseen
let pointsToAdd = 0;

//musiikkisoitin
let music = document.getElementById('musicPlayer');

//muuttuja joka määrittää onko quote ruudussa tällä hetkellä
let isQuoteActive = false;

//merkkiääni
let beep = document.getElementById('beep');


function preload ()
{
    //json-filet

    this.load.json('names', 'names.json');
    this.load.json('quotes', 'quotes.json');

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
    this.load.image('wiseCat', 'assets/wiseCat.png');
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

    //hahmon tiedot

    infoText = this.add.text(16, 437, 'Mindfulness points: ' + points + "  Entity's name: " + entityName, { fontSize: '16px', fill: '#f0e2f9', fontFamily: 'monospace' });

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

    //puun ajastin-teksti

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

    //viisas kissa

    wiseCat = this.physics.add.sprite(120, 398, 'wiseCat');
    wiseCat.setImmovable(true);
    wiseCat.body.allowGravity = false;

    this.physics.add.collider(entity, wiseCat, listenToTheCat, null, this);

    //mindversum-kone

    mindversum = this.physics.add.sprite(80, 154, 'mindversum');
    mindversum.setImmovable(true);
    mindversum.body.allowGravity = false;

    this.physics.add.collider(entity, mindversum, useMindversum, null, this);

    //mindversum-koneen nappien toiminta

    document.getElementById("yes").addEventListener("click", goToMindversum);
    document.getElementById("no").addEventListener("click", closeMindversum);

    //mindversumin tiedot

    mindversumText = this.add.text(16, -73, 'Entities in mindversum: ' + entityCount + "  Points in mindversum: " + mindversumPoints, { fontSize: '16px', fill: '#393743', fontFamily: 'monospace' });

    //musiikin säätely
    
    let musicButton = this.add.image(870, 20, 'note').setInteractive(); 
    let isPlaying = true;

    //musiikki menee tauolle ja takaisin päälle nappia painamalla
    musicButton.on('pointerdown', function () {
        if (isPlaying) {
            music.pause();
        } else {
            music.play();
        }
        isPlaying = !isPlaying;
    });
}

//muut funktiot:

//ajatuspilvi-koneen käyttö

function useCloudMachine() {

    //jos hahmo koskee esineen sivuja
    if (entity.body.touching.left || entity.body.touching.right) {

        //ajatuspilvi-koneen infon näyttäminen
        let thoughtInfo = document.getElementById("thoughtInfo");
        thoughtInfo.style.display = "block"; 

        //input-kentän näyttäminen
        let inputField = document.getElementById("thoughtInput");
        inputField.style.display = "block";
        inputField.focus(); 

        //määritellään että task on käynnissä (hahmo ei voi liikkua)
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

    //leijaileva ajatus -animaatio
    const flyingThought = scene.add.text(360, 200, userThought, {
        fontSize: '24px',
        fill: '#393743',
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

    //task ei ole enää käynnissä
    ongoingTask = false; 

}

//rauhoittumispuun käyttö

function useTree() {

    //jos hahmo koskee esineen sivuja
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
        timerText.setText('Done'); //ajastimen tilalle tulee teksti Done
        points += pointsToAdd; //lisätään mindfulness-pisteitä
        infoText.setText("Mindfulness points: " + points + "  Entity's name: " + entityName);
        localStorage.setItem("points", points); // tallennetaan pisteet localStorageen
        ongoingTask = false; //ajastin ei ole enää aktiivinen
        beep.play(); //soitetaan merkkiääni
    }

    //kun ajastin on -5 sekuntia, piilotetaan done-teksti
    if (this.initialTime <= -5) {
        timerText.setText(''); 
        timer.remove(); //poistetaan ajastin
    }
}

//puun valintanappien poistuminen näkyvistä
function closeTreeView() {
    document.getElementById("treeInfo").style.display = "none";
}


//jääkaapin käyttö

function useFridge() {

    //jos hahmo koskee esineen sivuja
    if (entity.body.touching.left || entity.body.touching.right) {
    //näytetään jääkaapin elementit
    let fridgeInfo = document.getElementById("fridgeInfo");
    fridgeInfo.style.display = "block"; 

    //task käynnissä
    ongoingTask = true; 
    }

}


//jääkaapin valintanappien poistuminen näkyvistä
function closeFridge() {

    points += 10; //lisätään mindfulness-pisteitä
    infoText.setText("Mindfulness points: " + points + "  Entity's name: " + entityName);
    localStorage.setItem("points", points); //tallennetaan pisteet localStorageen

    document.getElementById("fridgeInfo").style.display = "none"; //piilotetaan sisältö

    //task päättyy
    ongoingTask = false; 

    //animaatio, jossa hahmo sanoo Yum!
    const scene = game.scene.scenes[0]; 

    const yum = scene.add.text(790, 320, 'Yum!', {
        fontSize: '16px',
        fill: '#393743',
        fontFamily: 'monospace',
        align: 'center'
    }).setOrigin(0.5);

    scene.tweens.add({
        targets: yum,
        y: yum.y - 50,
        alpha: 0,
        duration: 1000,
        ease: 'Sine.easeOut',
        onComplete: () => yum.destroy()
    });


}

//viisas kissa kertoo affirmaatioita
function listenToTheCat() {
    //jos hahmo koskee esineen sivuja ja aiempi quote ei ole näkyvillä
    if ((entity.body.touching.left || entity.body.touching.right) && !isQuoteActive) {
        isQuoteActive = true; //quote on näkyvillä (uusi quote ei voi tulla päälle)

        const scene = game.scene.scenes[0];

        //haetaan random quote json filestä
        const quotes = scene.cache.json.get('quotes');
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const randomQuote = quotes[randomIndex];

        //quoten näyttäminen
        const showQuote = scene.add.text(70, 260, randomQuote, {
            fontSize: '16px',
            fill: '#393743',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0);

        scene.tweens.add({
            targets: showQuote,
            alpha: 0,
            duration: 7000,
            ease: 'Sine.easeOut',
            onComplete: () => {
                showQuote.destroy();
                isQuoteActive = false; // Sallitaan uuden quoten näyttäminen
            }
        });


        points += 10; //lisätäään pisteitä
        infoText.setText("Mindfulness points: " + points + "  Entity's name: " + entityName);
        localStorage.setItem("points", points); //tallennetaan pisteet localStorageen
    }
}


//mindversum-koneen käyttö
function useMindversum() {

    //jos hahmo koskee esineen sivuja
    if (entity.body.touching.left || entity.body.touching.right) {
    //näytetään mindversum-koneen elementit
    document.getElementById("mindversumInfo").style.display = "block";

    //task käynnissä
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

//task päättyy
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
    //haetaan nimet json filestä
    const names = scene.cache.json.get('names');
    //arvotaan nimi    
    entityName = names[Math.floor(Math.random() * names.length)];
    localStorage.setItem("entityName", entityName); // tallennetaan uusi nimi localStorageen

}



//liikkuminen

function update ()
{
    //jos task on käynnissä
    if (ongoingTask) {
        entity.setVelocityX(0); //pysäytetään hahmon liike
        entity.anims.play('turn'); //asetetaan hahmo paikalleen
        return; 
    }

    //nuolinäppäinten toiminta

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
