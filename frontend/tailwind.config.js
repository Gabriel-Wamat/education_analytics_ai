const config = {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                "primary-dark": "#102A43",
                "mid-blue": "#243B53",
                accent: "#00BFFF",
                success: "#38A169",
                highlight: "#F8BF24",
                white: "#FFFFFF",
                "grey-50": "#F0F4F8",
                "grey-300": "#D1D5DB",
                ink: "#243B53"
            },
            fontFamily: {
                heading: ["Inter", "sans-serif"],
                body: ["Open Sans", "sans-serif"],
                label: ["Open Sans", "sans-serif"]
            },
            boxShadow: {
                card: "0 8px 24px rgba(15, 23, 42, 0.06)"
            }
        }
    },
    plugins: []
};
export default config;
