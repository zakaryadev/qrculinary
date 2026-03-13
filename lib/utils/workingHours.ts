export type WorkingHours = {
  [key: string]: {
    open: string;
    close: string;
    is_closed: boolean;
  };
};

export function getOpenStatus(workingHours: WorkingHours | any, timezone: string = 'Asia/Tashkent') {
  try {
    const now = new Date();
    // Get current day abbreviation in target timezone
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone });
    const day = dayFormatter.format(now).toLowerCase().slice(0, 3); // 'mon', 'tue'...

    const todayHours = workingHours?.[day];

    if (!todayHours || todayHours.is_closed) return { isOpen: false, nextOpen: null };

    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);
    
    // Get current time in target timezone
    const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: timezone });
    const timeString = timeFormatter.format(now);
    // Be careful with 24:00 returned as 24:xx vs 00:xx in some browsers, split handle
    let [currHStr, currMStr] = timeString.split(':');
    let currH = Number(currHStr);
    if (currH === 24) currH = 0;
    const currM = Number(currMStr);

    const currentMinutes = currH * 60 + currM;
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    
    return { 
      isOpen, 
      openTime: todayHours.open,
      closeTime: todayHours.close
    };
  } catch (err) {
    console.error('Error calculating open status', err);
    return { isOpen: true, openTime: null, closeTime: null }; // Default to open on error
  }
}
