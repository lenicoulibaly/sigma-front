export function getUserFromAccessToken(token) {
    if (!token || typeof token !== "string" || token.split(".").length !== 3) {
        throw new Error("JWT invalide : format attendu header.payload.signature");
    }

    // ----- Décodage Base64URL → JSON -----
    const payloadB64 = token.split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const json = decodeURIComponent(
        atob(payloadB64)
            .split("")
            .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
    );
    const claims = JSON.parse(json);

    // ----- Mapping direct -----
    return {
        userId: Number(claims.sub),   // sub est toujours string → number
        email: claims.upn || "",      // upn est l’email
        firstName: claims.firstName || "",
        lastName: claims.lastName || "",
        tel: claims.tel || "",
        strId: claims.strId,          // laissé tel quel (number ou string selon ton backend)
        assoId: claims.assoId,
        sectionId: claims.sectionId
    };
}