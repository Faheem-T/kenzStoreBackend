type calculateDiscountArgs = {
    price: number;
    discountType: "percentage" | "fixed";
    discountValue: number;
}

export const calculateDiscount = ({ price, discountType, discountValue }: calculateDiscountArgs): number => {
    if (discountType === "percentage") {
        return Math.round((price - (price * discountValue / 100)) * 100 ) / 100
    } else if (discountType === "fixed") {
        return price - discountValue
    } else {
        return price
    }
}

type calculateDiscountActiveArgs = {
    discountStartDate: Date,
    discountEndDate: Date
}

export const calculateDiscountActive = ({ discountEndDate, discountStartDate }: calculateDiscountActiveArgs): boolean => {
    const currentDate = new Date();
    if (discountStartDate <= currentDate && discountEndDate > currentDate) return true
    else return false
}
