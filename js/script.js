const movies = ['Avengers', 'Iron Man', 'Harry Potter', 'Princezna ze mlejna', 'Pelíšky', 'Popelka'];
const dateSelector = document.querySelector('#date');
const sessionSelector = document.querySelector('#session');

// 1. Vygenerování / Aktualizace programu

function checkLocalStorage(){

    const storedData = JSON.parse(localStorage.getItem('data'));

    function generateNewDays(){   //Vygeneruje nový program na daný počet dní a uloží ho
        let days = [];
        for(let day = -7; day <= 7; day++){
            days.push(generateNewDay(day));
        }
        localStorage.setItem('data', JSON.stringify(days));
    }
    
    function actualiseExistingDays(){   //Zkountroluje aktuální datum a porovná ho s daty v ůložišti, aby odpovídala rozmezí týden zpěd a týden vpřed
        let lastDate = new Date();
        lastDate.setDate(lastDate.getDate() - 7);
        lastDate.setHours(0,0,0,0);
        
        localStorage.setItem('data', JSON.stringify(removeAndAddDays(lastDate)));
    }

    function removeAndAddDays(lastDate){    //Vytvoří nové pole dat z existujícího pole podle požadovaného posledního dne, případně vygeneruje dny nové
        let days = [];
        let newDays = 0;
        storedData.forEach(function(day){
            let checkedDate = new Date(day[0].date);
            if(checkedDate >= lastDate){    //Pokud je kontrolované datum větší nebo rovno, než poslední možné, je vloženo do pole, které bude poté zapsáno do local storage
                days.push(day);
            }
            else{
                newDays++;  //Pokud je kontrolované datum menší, než poslední možné, zvětší se hodnota newDays, podle které se pak vygeneruje daný počet nových dní
            }
        });
        for(let i = (newDays - 1); i >= 0; i--){
            days.push(generateNewDay(7 - i));
        }
        return days;
    }
    
    function generateNewDay(day){  //Vygeneruje program na den
        let dayProgramme = [];
        for(let nthSession = 0; nthSession < 6; nthSession++){
            dayProgramme.push(generateNewSession(day, nthSession));
        }
        return dayProgramme;
    }

    function generateNewSession(day, nthSession){  //Vygeneruje session
        let random = Math.floor(Math.random() * movies.length);
        let date = new Date();
        date.setDate(date.getDate() + day);
        date.setHours(10 + nthSession*2, 0, 0, 0);
        let session = {
            'session': movies[random],
            'bookedSeats': [],
            'date': date
        };
        return session;
    }

    if(localStorage.getItem('data') === null){   //Zabrání generování nového programu, pokud je již v úložišti program uložený
        generateNewDays();
    }
    else{
        actualiseExistingDays();
    }
}

// 2. Vytvoření plánku
function createCinemaHallPlan(){

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
    }

    function identifySeats(){   //Přidá labelům číslo a checkboxům id
        let allSeats = document.querySelectorAll('.seat');
        allSeats.forEach(function(seat, i){
            let number = allSeats.length - i;
            identifyLabel(seat, number);
            identifyCheckbox(seat, number);
        });

        function identifyLabel(seat, number){   
            let label = seat.querySelector('.seat-number');
            label.innerText = number;
            label.setAttribute('for', 'seat' + (number));  
        }
        
        function identifyCheckbox(seat, number){
            let checkbox = seat.querySelector('.seat-checkbox');
            checkbox.value = number;
            checkbox.id = 'seat' + number;
            checkbox.addEventListener('change', function(){
                if(!seat.matches('.booked')){       //Zabrání, aby třídu selected mohly obdržet již vybraná sedadla
                    seat.classList.toggle('selected');
                }
            });
        }
    }
    
    cloneRow();
    identifySeats();
}

// 3. Vytvoření selectů

function createForm(){    //Vytvoří seznam dat podle local storage
    const storedData = JSON.parse(localStorage.getItem('data'));
    const seatCheckboxes = document.querySelectorAll('.seat-checkbox');

    //Vytvoření selectu data
    function appendDateOptions(){    //Vkládá jednotlivé položky do selectu data
        storedData.forEach(function(day, i){
            dateSelector.appendChild(createDateOption(day, i));
        });
        dateSelector.addEventListener('change', dateSelected);
    }
    
    function createDateOption(day, i){ //Vytváří položku option pro datum
        let option = document.createElement('option');
        let date = new Date(day[0].date);
        option.innerText = date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
        option.value = i;
        if(isDateInPast(date, true)){  //Zkontroluje, zda je datum v minulosti
            option.classList.add('past');
        }
        return option;
    }
    
    function dateSelected(){    //Pokud je zavolána (např. event listenerem), proveduje následující:
        appendSessionOptions();
        disablePastSessions(storedData[dateSelector.value][sessionSelector.value].date);
        showAvailablityOfSeats();
        if(sessionSelector.classList.contains('hidden')){
            showSessionPlanAndButton();
        }
    }
    
    //Vytvoření selectu session

    function appendSessionOptions(){  //Vkládá jednotlivé položky do session selectoru
        sessionSelector.innerHTML = '';   //Vyčistí select od předchozích možností
        let sessions = storedData[dateSelector.value]; //Vybere program v závislosti na vybraném datu

        sessions.forEach(function(item, i){
            sessionSelector.appendChild(createSessionOption(item, i));
        });
        sessionSelector.addEventListener('change', sessionSelected);
    }

    function sessionSelected(){
        disablePastSessions(storedData[dateSelector.value][sessionSelector.value].date);
        showAvailablityOfSeats();
    }

    function createSessionOption(item, i){
        let option = document.createElement('option');
        let date = new Date(item.date);
        let time = (date.toLocaleTimeString()).slice(0,-3);
        option.innerText = time + ' ' + item.session;
        option.value = i;
        if(isDateInPast(date)){    //Zkontroluje, zda již session proběhla
            option.classList.add('past');
        }
        return option;
    }

    function showAvailablityOfSeats(){   //Zobrazení statusu obsazenosti filmu 
        let session = storedData[dateSelector.value][sessionSelector.value].bookedSeats;
        seatCheckboxes.forEach(function(seatCheckbox){
            seatCheckbox.parentElement.classList.remove('selected');
            if(session.some(function(seat){if(seat === seatCheckbox.value){return true;}})){
                seatCheckbox.disabled = true;
                seatCheckbox.parentElement.classList.add('booked');
                seatCheckbox.parentElement.title = 'Obsazeno';
            }
            else{
                seatCheckbox.disabled = false;
                seatCheckbox.parentElement.classList.remove('booked');
                //title se nemaže protože ho vždy přemaže funkce disablePastSessions
            }
        });
    }

    function disablePastSessions(checkedDate){    //Zabrání, aby bylo možné vybrat sedadla v minulosti
        const allSeats = document.querySelectorAll('.seat');
        if(isDateInPast(checkedDate)){
            allSeats.forEach(function(seat){
                seat.classList.add('disabled');
                seat.querySelector('.seat-checkbox').disabled = true;
                seat.title = "Toto promítání již proběhlo";
            });
        }
        else{
            allSeats.forEach(function(seat){
                seat.classList.remove('disabled');
                seat.querySelector('.seat-checkbox').disabled = false;
                seat.title = '';
            });
        }
    }

    function isDateInPast(date, checkOnlyDate){   //Zkontroluje, jestli je kontrolovaný čas v minulosti
        let currentDate = new Date();
        let checkedDate = new Date(date);

        if(checkOnlyDate === true){
            currentDate.setHours(0,0,0,0);
        }

        return checkedDate < currentDate;
    }

    function showSessionPlanAndButton(){
        sessionSelector.classList.remove('hidden');
        document.querySelector('tbody').classList.remove('hidden');
        document.querySelector('.submit-button').classList.remove('hidden');
    }

    function booking(){ //Rezervační funkce
        const bookingButton = document.querySelector('.submit-button');
        bookingButton.addEventListener('click', bookSession); 

        function bookSession(){
            let checkedSeats = [];
            seatCheckboxes.forEach(function(checkbox){  //Zkontroluje, které checkboxy jsou zakliknuté a jejich hodnoty uloží do storedData
                if(checkbox.checked){
                    storedData[dateSelector.value][sessionSelector.value].bookedSeats.push(checkbox.value);
                    checkedSeats.push(checkbox.value);  //Uloží číslo sedadla do pole, které je pak předáno pro vytvoření zprávy
                    checkbox.checked = false;   //Zresetuje zakliknuté checkboxy
                }
            });
            if(checkedSeats.length > 0){    //Pokud bylo do pole uloženo alespoň jedno číslo, znamená to, že byl některý z checkboxů zakliknut a proběhne následující:
                localStorage.setItem('data', JSON.stringify(storedData)); //Data se uloží do localStorage
                showBookingMessage(true, checkedSeats); //Zavolá funkci, která vytvoří zprávu o rezervaci a rezervovaných sedadlech
                showAvailablityOfSeats(); //Znovu projede všechna sedadla a z vybraných udělá zarezervované
            }
            else{
                showBookingMessage(false);  //Zavolá funkci, která vytvoří zprávu vyzývající k vybrání alespon jednoho sedadla
            }
        }
    }

    function showBookingMessage(status, seats){ //Poskládá zprávu o rezervovaných sedadlech
        const bookingMessageWrapper = document.querySelector('.booking-message-wrapper');
        const bookingMessage = document.querySelector('.booking-message');
        const closeButton = document.querySelector('.close-message');

        closeButton.addEventListener('click', function(){
            bookingMessageWrapper.classList.add('hidden');
        });

        function createSuccessMessage(){
            let bookedDate = new Date(storedData[dateSelector.value][sessionSelector.value].date);
            let bookedSession = storedData[dateSelector.value][sessionSelector.value].session;
            let text = 'Rezervováno dne ' + bookedDate.getDate() + '.' + (bookedDate.getMonth() + 1) + '.' + bookedDate.getFullYear() + ' - ' + (bookedDate.toLocaleTimeString()).slice(0,-3) + ', ' + bookedSession + ', ';
            seats.forEach(function(seat, i){
                if(seats.length === 1){
                    text+= 'sedadlo ' + seat;
                }
                else if(i === 0){
                    text+= 'sedadla ' + seat ;
                }
                else{
                    text+= ', ' + seat;
                }
            });
            text+= '.';
            bookingMessage.innerText = text;
            bookingMessageWrapper.classList.remove('warning');
            bookingMessageWrapper.classList.remove('hidden');
            bookingMessageWrapper.classList.add('success');  
        }

        function createWarningMessage(){
            bookingMessage.innerText = 'Pro úspěšnou rezervaci prosím vyberte alespoň jedno sedadlo';
            bookingMessageWrapper.classList.remove('success');
            bookingMessageWrapper.classList.remove('hidden');
            bookingMessageWrapper.classList.add('warning');
        }

        if(status === false){
            createWarningMessage();
        }
        else{
            createSuccessMessage();
        }
    }
    appendDateOptions();
    booking();
}

function init(){
    checkLocalStorage();
    createCinemaHallPlan();
    createForm();
}

init();