import { createContext, useState, useRef } from "react";


const LobbyContext = createContext();



export function LobbyProvider({children}){

    const [lobbyID, setLobbyID] = useState("");
    
    const [selectedSwapCards, setSelectedSwapCards] = useState([])
    const webSocketSite = "ws://localhost:8080/ws/lobby"
    const backendSite = "http://localhost:8080/"
    let nicknameRef = useRef("")

    //const webSocketSite = "wss://cambio-backend-2smc.onrender.com/ws/lobby"
    //const backendSite = "https://cambio-backend-2smc.onrender.com/";

    return(
        <LobbyContext.Provider value = {{
            selectedSwapCards, setSelectedSwapCards,
            backendSite, lobbyID, setLobbyID, webSocketSite,
            nicknameRef
        }}>
            {children}
        </LobbyContext.Provider>
    )
}


export default LobbyContext;