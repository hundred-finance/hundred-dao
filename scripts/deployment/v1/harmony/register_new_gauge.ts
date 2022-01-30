import {registerGauge} from "../common/deploy";

registerGauge(
    "harmony",
    "0x1747d329cb37e0a0f387f24065addbc60eab69dd"
)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});