exports.otpVerified = (otpTime) => {
  const cDateTime = new Date();

  let differenceTime = (otpTime - cDateTime.getTime()) / 1000;
  differenceTime /= 60;
  const minutes = Math.abs(differenceTime);

  if (minutes > 2) {
    return true;
  }
  return false;
};
