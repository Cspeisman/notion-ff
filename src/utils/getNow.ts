export default () => {
    // gets the current time to the closest second
    // it will always 00:00 out the second and millisecond
    const coeff = 1000 * 60;
    return new Date(Math.floor(Date.now() / coeff) * coeff).toISOString();
}
