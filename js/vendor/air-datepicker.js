/*!
* Air Datepicker 3.3.0
* Custom implementation for Mitnafun
*/

(function () {
'use strict';

/**
 * Air Datepicker implementation
 * This file contains the core functionality needed for the date picker to work
 */
var AirDatepicker = /** @class */ (function () {
    function AirDatepicker(el, options) {
        this.el = typeof el === 'string' ? document.querySelector(el) : el;
        if (!this.el) {
            console.error('AirDatepicker: Invalid element provided');
            return;
        }
        
        this.opts = Object.assign({}, AirDatepicker.defaultOptions, options || {});
        this.init();
    }
    
    AirDatepicker.prototype.init = function() {
        console.log('AirDatepicker initialized');
        this.selectedDates = [];
        this.disabledDates = [];
        this.renderCalendar();
        this.bindEvents();
    };
    
    AirDatepicker.prototype.renderCalendar = function() {
        // Create calendar container
        this.calendarEl = document.createElement('div');
        this.calendarEl.className = 'air-datepicker';
        
        // Create month navigation
        var navEl = document.createElement('div');
        navEl.className = 'air-datepicker-nav';
        
        var prevBtn = document.createElement('div');
        prevBtn.className = 'air-datepicker-nav--action air-datepicker-nav--action-prev';
        prevBtn.innerHTML = '&larr;';
        prevBtn.addEventListener('click', this.prevMonth.bind(this));
        
        var nextBtn = document.createElement('div');
        nextBtn.className = 'air-datepicker-nav--action air-datepicker-nav--action-next';
        nextBtn.innerHTML = '&rarr;';
        nextBtn.addEventListener('click', this.nextMonth.bind(this));
        
        var title = document.createElement('div');
        title.className = 'air-datepicker-nav--title';
        
        navEl.appendChild(prevBtn);
        navEl.appendChild(title);
        navEl.appendChild(nextBtn);
        
        // Create calendar body
        var bodyEl = document.createElement('div');
        bodyEl.className = 'air-datepicker-body';
        
        // Create days header
        var daysHeaderEl = document.createElement('div');
        daysHeaderEl.className = 'air-datepicker-body--day-names';
        
        var dayNames = this.opts.locale.daysMin || ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        var firstDay = this.opts.firstDay || 0;
        
        for (var i = 0; i < 7; i++) {
            var dayIndex = (i + firstDay) % 7;
            var dayNameEl = document.createElement('div');
            dayNameEl.className = 'air-datepicker-body--day-name';
            dayNameEl.innerHTML = dayNames[dayIndex];
            daysHeaderEl.appendChild(dayNameEl);
        }
        
        bodyEl.appendChild(daysHeaderEl);
        
        // Create days container
        this.daysContainer = document.createElement('div');
        this.daysContainer.className = 'air-datepicker-body--cells';
        bodyEl.appendChild(this.daysContainer);
        
        // Assemble calendar
        this.calendarEl.appendChild(navEl);
        this.calendarEl.appendChild(bodyEl);
        
        // Add to container
        this.el.appendChild(this.calendarEl);
        
        // Set initial date
        this.currentDate = new Date();
        this.viewDate = new Date(this.currentDate);
        
        // Render days
        this.updateTitle(title);
        this.renderDays();
    };
    
    AirDatepicker.prototype.updateTitle = function(titleEl) {
        if (!titleEl) {
            titleEl = this.calendarEl.querySelector('.air-datepicker-nav--title');
        }
        
        var monthNames = this.opts.locale.months || [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        titleEl.innerHTML = monthNames[this.viewDate.getMonth()] + ' ' + this.viewDate.getFullYear();
    };
    
    AirDatepicker.prototype.renderDays = function() {
        this.daysContainer.innerHTML = '';
        
        var year = this.viewDate.getFullYear();
        var month = this.viewDate.getMonth();
        
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var daysInPrevMonth = new Date(year, month, 0).getDate();
        
        var firstDay = (firstDay - (this.opts.firstDay || 0) + 7) % 7;
        
        // Previous month days
        for (var i = 0; i < firstDay; i++) {
            var day = daysInPrevMonth - firstDay + i + 1;
            var date = new Date(year, month - 1, day);
            this.renderDay(date, 'air-datepicker-cell -other-month-');
        }
        
        // Current month days
        for (var i = 1; i <= daysInMonth; i++) {
            var date = new Date(year, month, i);
            this.renderDay(date, 'air-datepicker-cell');
        }
        
        // Next month days
        var cellsCount = this.daysContainer.childNodes.length;
        var cellsNeeded = Math.ceil(cellsCount / 7) * 7;
        
        for (var i = cellsCount; i < cellsNeeded; i++) {
            var day = i - cellsCount + 1;
            var date = new Date(year, month + 1, day);
            this.renderDay(date, 'air-datepicker-cell -other-month-');
        }
    };
    
    AirDatepicker.prototype.renderDay = function(date, className) {
        var dayEl = document.createElement('div');
        dayEl.className = className;
        dayEl.innerHTML = date.getDate();
        dayEl.dataset.date = this.formatDate(date, 'yyyy-mm-dd');
        
        // Check if day is today
        var today = new Date();
        if (date.getDate() === today.getDate() && 
            date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear()) {
            dayEl.classList.add('-current-');
        }
        
        // Check if day is selected
        if (this.isDateSelected(date)) {
            dayEl.classList.add('-selected-');
        }
        
        // Check if day is in range
        if (this.isDateInRange(date)) {
            dayEl.classList.add('-in-range-');
        }
        
        // Check if day is disabled
        if (this.isDateDisabled(date)) {
            dayEl.classList.add('-disabled-');
        } else {
            dayEl.addEventListener('click', this.onDayClick.bind(this, date));
        }
        
        // Apply custom cell render
        if (this.opts.onRenderCell) {
            var cellData = this.opts.onRenderCell(date, 'day');
            if (cellData) {
                if (cellData.disabled) {
                    dayEl.classList.add('-disabled-');
                    dayEl.removeEventListener('click', this.onDayClick.bind(this, date));
                }
                
                if (cellData.classes) {
                    var classes = cellData.classes.split(' ');
                    classes.forEach(function(cls) {
                        if (cls) dayEl.classList.add(cls);
                    });
                }
            }
        }
        
        this.daysContainer.appendChild(dayEl);
    };
    
    AirDatepicker.prototype.isDateSelected = function(date) {
        return this.selectedDates.some(function(selectedDate) {
            return this.isSameDay(selectedDate, date);
        }, this);
    };
    
    AirDatepicker.prototype.isDateInRange = function(date) {
        if (this.selectedDates.length !== 2) return false;
        
        var start = this.selectedDates[0];
        var end = this.selectedDates[1];
        
        if (start > end) {
            var temp = start;
            start = end;
            end = temp;
        }
        
        return date > start && date < end;
    };
    
    AirDatepicker.prototype.isDateDisabled = function(date) {
        // Check min/max dates
        if (this.opts.minDate && date < this.opts.minDate) return true;
        if (this.opts.maxDate && date > this.opts.maxDate) return true;
        
        // Check weekends
        if (this.opts.weekends && this.opts.weekends.includes(date.getDay())) return true;
        
        // Check disabled dates
        return this.disabledDates.some(function(disabledDate) {
            return this.isSameDay(disabledDate, date);
        }, this);
    };
    
    AirDatepicker.prototype.isSameDay = function(date1, date2) {
        return date1.getDate() === date2.getDate() && 
               date1.getMonth() === date2.getMonth() && 
               date1.getFullYear() === date2.getFullYear();
    };
    
    AirDatepicker.prototype.onDayClick = function(date) {
        if (this.opts.range) {
            this.handleRangeSelection(date);
        } else {
            this.selectDate(date);
        }
    };
    
    AirDatepicker.prototype.handleRangeSelection = function(date) {
        if (this.selectedDates.length === 0 || this.selectedDates.length === 2) {
            // Start new selection
            this.selectedDates = [date];
            this.renderDays();
        } else {
            // Complete selection
            this.selectedDates.push(date);
            
            // Ensure correct order
            if (this.selectedDates[0] > this.selectedDates[1]) {
                this.selectedDates.reverse();
            }
            
            this.renderDays();
            
            // Trigger select event
            if (this.opts.onSelect) {
                this.opts.onSelect({
                    date: this.selectedDates,
                    formattedDate: this.selectedDates.map(function(d) {
                        return this.formatDate(d, this.opts.dateFormat);
                    }, this),
                    datepicker: this
                });
            }
        }
    };
    
    AirDatepicker.prototype.selectDate = function(date) {
        if (this.opts.multipleDates) {
            var index = this.selectedDates.findIndex(function(selectedDate) {
                return this.isSameDay(selectedDate, date);
            }, this);
            
            if (index !== -1) {
                // Deselect date
                this.selectedDates.splice(index, 1);
            } else {
                // Add date
                this.selectedDates.push(date);
            }
        } else {
            this.selectedDates = [date];
        }
        
        this.renderDays();
        
        // Trigger select event
        if (this.opts.onSelect) {
            this.opts.onSelect({
                date: this.opts.multipleDates ? this.selectedDates : this.selectedDates[0],
                formattedDate: this.opts.multipleDates ? 
                    this.selectedDates.map(function(d) { 
                        return this.formatDate(d, this.opts.dateFormat);
                    }, this) : 
                    this.formatDate(this.selectedDates[0], this.opts.dateFormat),
                datepicker: this
            });
        }
    };
    
    AirDatepicker.prototype.prevMonth = function() {
        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        this.updateTitle();
        this.renderDays();
    };
    
    AirDatepicker.prototype.nextMonth = function() {
        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
        this.updateTitle();
        this.renderDays();
    };
    
    AirDatepicker.prototype.formatDate = function(date, format) {
        if (!date) return '';
        
        format = format || 'yyyy-mm-dd';
        
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        
        return format
            .replace(/yyyy/g, year)
            .replace(/mm/g, month < 10 ? '0' + month : month)
            .replace(/dd/g, day < 10 ? '0' + day : day);
    };
    
    AirDatepicker.prototype.bindEvents = function() {
        // Add any global event listeners if needed
    };
    
    AirDatepicker.prototype.clear = function() {
        this.selectedDates = [];
        this.renderDays();
    };
    
    AirDatepicker.defaultOptions = {
        inline: false,
        multipleDates: false,
        range: false,
        toggleSelected: true,
        weekends: [6, 0], // Saturday and Sunday
        firstDay: 0, // Sunday
        dateFormat: 'yyyy-mm-dd',
        locale: {
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            months: [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ],
            monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            today: 'Today',
            clear: 'Clear',
            firstDay: 0
        }
    };
    
    return AirDatepicker;
}());

// Export to global scope
window.AirDatepicker = AirDatepicker;

})();
