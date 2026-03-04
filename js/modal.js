document.addEventListener('DOMContentLoaded', () => {
    const modalHTML = `
    <!-- Global Smart Inquiry Modal -->
    <div class="inquiry-modal-overlay" id="inquiryModal">
        <div class="inquiry-modal">
            
            <!-- Default Form State -->
            <div id="modalFormContainer">
                <div class="modal-header">
                    <h3 id="modalTitle">Request a Quote</h3>
                    <button class="modal-close" id="closeModalBtn">&times;</button>
                </div>
                
                <div class="modal-body">
                    <form id="smartInquiryForm" class="modal-form">
                        
                        <!-- Dynamic Section: Air Tickets -->
                        <div id="fieldsFlight" class="modal-dynamic-fields">
                            <div class="form-section-title">Trip Details</div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Departure City</label>
                                    <input type="text" placeholder="e.g. London" required>
                                </div>
                                <div class="form-group">
                                    <label>Arrival City</label>
                                    <input type="text" placeholder="e.g. Dubai" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Departure Date</label>
                                    <input type="date" required>
                                </div>
                                <div class="form-group">
                                    <label>Return Date (Optional)</label>
                                    <input type="date">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Passengers</label>
                                    <input type="number" min="1" placeholder="1" required>
                                </div>
                                <div class="form-group">
                                    <label>Travel Class</label>
                                    <select required>
                                        <option value="economy">Economy</option>
                                        <option value="premium">Premium Economy</option>
                                        <option value="business">Business</option>
                                        <option value="first">First Class</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Dynamic Section: Umrah Packages -->
                        <div id="fieldsUmrah" class="modal-dynamic-fields">
                            <div class="form-section-title">Package Details</div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Adults</label>
                                    <input type="number" min="1" placeholder="1" required>
                                </div>
                                <div class="form-group">
                                    <label>Children</label>
                                    <input type="number" min="0" placeholder="0" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Preferred Travel Month</label>
                                    <input type="month" required>
                                </div>
                                <div class="form-group">
                                    <label>Package Tier</label>
                                    <select required>
                                        <option value="economy">Economy</option>
                                        <option value="standard">Standard</option>
                                        <option value="premium">Premium Luxury</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Hotel Preference (Optional)</label>
                                <input type="text" placeholder="e.g. Near Haram, Specific Name">
                            </div>
                        </div>

                        <!-- Contact Details (Always Visible) -->
                        <div class="form-section-title" style="margin-top: 24px;">Personal Information</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="John Doe" required>
                            </div>
                            <div class="form-group">
                                <label>Email Address (Optional)</label>
                                <input type="email" placeholder="john@example.com">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Phone Number</label>
                                <input type="tel" placeholder="+1 234 567 8900" required>
                            </div>
                            <div class="form-group">
                                <label>WhatsApp Number</label>
                                <input type="tel" placeholder="+1 234 567 8900" required>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="modal-footer">
                    <button type="submit" form="smartInquiryForm" class="btn btn-primary btn-block btn-lg" style="width: 100%;">
                        Submit Request <i class="fas fa-paper-plane" style="margin-left: 8px;"></i>
                    </button>
                    
                    <!-- Trust Signals for Flights -->
                    <div id="trustFlight" class="form-trust-signals">
                        <div class="trust-signal-item"><i class="fas fa-check"></i> No hidden charges</div>
                        <div class="trust-signal-item"><i class="fas fa-check"></i> Transparent fare breakdown</div>
                        <div class="trust-signal-item"><i class="fas fa-check"></i> Quick response within 30 minutes</div>
                    </div>

                    <!-- Trust Signals for Umrah -->
                    <div id="trustUmrah" class="form-trust-signals">
                        <div class="trust-signal-item"><i class="fas fa-check"></i> Transparent package pricing</div>
                        <div class="trust-signal-item"><i class="fas fa-check"></i> Trusted Saudi vendors</div>
                        <div class="trust-signal-item"><i class="fas fa-check"></i> Dedicated support team</div>
                    </div>

                    <!-- Reassurance Note -->
                    <div class="form-reassurance">
                        Your information is secure and will never be shared.
                    </div>
                </div>
            </div>

            <!-- Success State -->
            <div id="modalSuccessState" class="modal-success-state">
                <div class="success-icon-wrapper">
                    <i class="fas fa-check"></i>
                </div>
                <h3>Request Received</h3>
                <p>Thank you for your inquiry. Our team will contact you shortly to assist with your travel plans.</p>
                <button class="btn btn-primary btn-lg" id="closeSuccessBtn">Close Window</button>
            </div>

        </div>
    </div>
    `;

    // Inject modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('inquiryModal');
    const closeBtn = document.getElementById('closeModalBtn');
    const successCloseBtn = document.getElementById('closeSuccessBtn');
    const formContainer = document.getElementById('modalFormContainer');
    const successState = document.getElementById('modalSuccessState');
    const form = document.getElementById('smartInquiryForm');
    const modalTitle = document.getElementById('modalTitle');

    const flightFields = document.getElementById('fieldsFlight');
    const umrahFields = document.getElementById('fieldsUmrah');
    const trustFlight = document.getElementById('trustFlight');
    const trustUmrah = document.getElementById('trustUmrah');

    // Button Selectors that trigger the modal
    // Match any link or button containing specific text variations, ignoring direct external links like mailto/whatsapp
    const triggerKeywords = ['book now', 'get fare quote', 'explore packages', 'request custom quote', 'request custom plan', 'book standard', 'inquire now', 'request vip quote'];

    document.querySelectorAll('a, button').forEach(el => {
        const text = el.innerText.toLowerCase();
        if (triggerKeywords.some(keyword => text.includes(keyword)) && !el.href?.includes('mailto:') && !el.href?.includes('wa.me')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(determineServiceType(el));
            });
        }
    });

    function determineServiceType(element) {
        const path = window.location.pathname.toLowerCase();
        const text = element.innerText.toLowerCase();

        // Priority 1: Check the triggering button's text context
        if (text.includes('package') || text.includes('umrah') || text.includes('standard') || text.includes('vip')) return 'umrah';
        if (text.includes('fare') || text.includes('flight')) return 'flight';

        // Priority 2: Check current page URL
        if (path.includes('umrah.html')) return 'umrah';
        if (path.includes('air-ticket.html')) return 'flight';

        return 'flight'; // Default fallback
    }

    function openModal(serviceType) {
        // Reset states
        formContainer.style.display = 'block';
        successState.classList.remove('active');
        form.reset();

        // Toggle dynamic fields and trust signals
        flightFields.classList.remove('active');
        umrahFields.classList.remove('active');
        trustFlight.classList.remove('active');
        trustUmrah.classList.remove('active');

        // Disable required attributes on hidden fields to allow form submission
        Array.from(flightFields.querySelectorAll('input, select')).forEach(input => input.removeAttribute('required'));
        Array.from(umrahFields.querySelectorAll('input, select')).forEach(input => input.removeAttribute('required'));

        if (serviceType === 'umrah') {
            modalTitle.innerText = 'Umrah Package Inquiry';
            umrahFields.classList.add('active');
            trustUmrah.classList.add('active');
            Array.from(umrahFields.querySelectorAll('input, select')).forEach(input => {
                if (input.placeholder !== 'e.g. Near Haram, Specific Name') input.setAttribute('required', 'true'); // Dont require hotel preference
            });
        } else {
            modalTitle.innerText = 'Flight Ticket Inquiry';
            flightFields.classList.add('active');
            trustFlight.classList.add('active');
            Array.from(flightFields.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]:first-of-type, select')).forEach(input => {
                input.setAttribute('required', 'true');
            });
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.style.overflow = '';
        }, 400); // Wait for transition
    }

    closeBtn.addEventListener('click', closeModal);
    successCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Simulate API call
        formContainer.style.display = 'none';
        successState.classList.add('active');
    });
});
