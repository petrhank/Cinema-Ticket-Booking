// Vygenerování nového programu

const movies = ['Avengers', 'Iron Man', 'Harry Potter', 'Princezna ze mlejna', 'Pelíšky', 'Popelka'];

function checkLocalStorage(){
    if(localStorage.getItem('generated') !== 'true'){   //Zabrání generování nového programu, pokud je již v úložišti program uložený
        generateProgramme();
    }
};

function generateProgramme(){   //Vygeneruje nový program na daný počet dní a uloží ho
    localStorage.setItem('generated','true'); 
    let data = [];
    for(let day = -7; day <= 7; day++){
        let dayProgramme = [];
        for(let nthSession = 0; nthSession < 6; nthSession++){
            dayProgramme.push(generateSession(day, nthSession));
        };
        data.push(dayProgramme);
    };
    localStorage.setItem('data', JSON.stringify(data));
};

function generateSession(day, nthSession){
        let random = Math.floor(Math.random() * movies.length);
        let date = new Date;
        date.setDate(date.getDate() + day);
        date.setHours(8 + 1 + nthSession*2, 0, 0, 0);
        let session = {
            'session': movies[random],
            'bookedSeats': [],
            'date': date
        }
        return session;
}

//VYTVOŘENÍ SELECTŮ

function createOptions(){    //Vytvoří seznam dat podle local storage (zatím se neaktualizuje podle dne)
    const data = JSON.parse(localStorage.getItem('data'));
    const selectDate = document.querySelector('#date');
    const selectSession = document.querySelector('#session');
    dateOptions();

    //Vytvoření selectu data

    function dateOptions(){    //Vytváří jednotlivé položky pro volbu data
        
        data.forEach(function(item, i){
            selectDate.appendChild(createDateOption(item, i));
        });
        selectDate.addEventListener('change', dateSelected);
    };

    function dateSelected(){
        sessionOptions();
        sessionStatus();
        checkDate(data[selectDate.value][selectSession.value].date);
    };

    function createDateOption(item, i){
        let option = document.createElement('option');
        let date = new Date(item[0].date);
        option.innerText = date.getDate() + '. ' + (date.getMonth() + 1) + '. ' + date.getFullYear();
        option.setAttribute('value', i);
        return option;
    };

    //Vytvoření selectu session

    function sessionOptions(){  //Vytváří jednotlivé položky v závislosti na tom, který index mu je v závislosti na zvoleném datu předán
        selectSession.innerHTML = '';   //Vyčistí select od původních možností
        let sessions = data[selectDate.value];
        sessions.forEach(function(item, i){
            selectSession.appendChild(createSessionOption(item, i));
        });
        selectSession.addEventListener('change', function(){
            sessionStatus();
            checkDate(data[selectDate.value][selectSession.value].date);
        });
    }

    function createSessionOption(item, i){
        let option = document.createElement('option');
        option.innerText = item.session;
        option.setAttribute('value', i);
        return option;
    };

    //Zobrazení statusu obsazenosti filmu
    function sessionStatus(){
        const allSeatCheckboxes = document.querySelectorAll('.seat-checkbox');
        let session = data[selectDate.value][selectSession.value].bookedSeats;
        allSeatCheckboxes.forEach(function(seatCheckbox){
            seatCheckbox.parentElement.classList.remove('selected');
            if(session.some(function(bookedSeat){if(bookedSeat === seatCheckbox.value){return true;}})){
                seatCheckbox.parentElement.classList.add('booked');
            }
            else{
                seatCheckbox.parentElement.classList.remove('booked');
            }
        });
    };

    function checkDate(checkedDate){
        let currentDate = new Date;
        const allSeats = document.querySelectorAll('.seat');
        if(new Date(checkedDate) < currentDate){
            allSeats.forEach(function(seat){
                seat.classList.add('disabled');
            });
        }
        else{
            allSeats.forEach(function(seat){
                seat.classList.remove('disabled');
            });
        }
    };
};

//Vytvoření plánku
function generateRoom(){
    cloneRow();
    identifySeats();
};

function cloneRow(){
    const tBody = document.querySelector('tbody');
    const row = document.querySelector('.row');

    for(let i = 0; i < 8; i++){
        if(i === 3){
            tBody.appendChild(createCorridor());
        }
        else{
            tBody.appendChild(row.cloneNode(true));
        }

    }

    function createCorridor(){
        const corridor = document.createElement('tr');
        corridor.classList.add('corridor');
        return corridor;
    }
};

//Označení sedadel

function identifySeats(){
    let allSeats = document.querySelectorAll('.seat');
    allSeats.forEach(function(seat, i){
        let number = i + 1;
        identifyLabel(seat, number);
        identifyCheckbox(seat, number)
    })
};

function identifyLabel(seat, number){
    let label = seat.querySelector('.seat-number');
    label.innerText = number;
    label.setAttribute('for', 'seat' + (number));  
};

function identifyCheckbox(seat, number){
    let checkbox = seat.querySelector('.seat-checkbox');
    checkbox.setAttribute('value', number);
    checkbox.setAttribute('id', 'seat' + number);
    checkbox.addEventListener('change', function(){
        if(!seat.matches('.booked')){       //Zabrání, aby třídu selected mohly obdržet již vybraná sedadla
            seat.classList.toggle('selected');
        };
    });
}

// function booking(){
//     const bookingForm = document.querySelector('.booking-form');
//     bookingForm.addEventListener('submit', function(){
//         const seatCheckboxes = document.querySelectorAll('.seat-checkbox');
//         let data = JSON.parse(localStorage.getItem('data'));
//         seatCheckboxes.forEach(function(item){
//             if(item.checked){
//                 let selectedDate = document.querySelector('#date').value;
//                 let selectedSession = document.querySelector('#session').value;
//                 data[selectedDate][selectedSession].bookedSeats.push(item.value);
//             }
//         });
//         localStorage.setItem('data', JSON.stringify(data));
//     }); 
// };



//Sdružovací funkce

function init(){
    checkLocalStorage();
    createOptions();
    generateRoom();
    booking();
};

init();




