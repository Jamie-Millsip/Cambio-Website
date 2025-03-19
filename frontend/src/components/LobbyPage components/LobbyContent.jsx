import LobbyReadyUpView from './LobbyContent components/LobbyReadyUpView.jsx';
import EnterNicknameView from './LobbyContent components/EnterNicknameView.jsx';
import ErrorView from './LobbyContent components/ErrorView.jsx';
import { useEffect, useContext, useState, useRef } from "react";
import Stomp from 'stompjs';
import axios from 'axios';
import GamePage from '../../pages/GamePage.jsx';
import LobbyContext from '../../pages/LobbyContext.jsx';
import "../../pages/Body.css";

function LobbyContent({lobbyID}){

    const {
        setLobbyID,
        backendSite,
    } = useContext(LobbyContext);


        const [triggerVar, trigger] = useState(0)
        const [messageArray, setMessageArray] = useState([])
        const [cards, setCards] = useState([])
        const [exists, setExists] = useState(false)
        const [gameScreen, setGameScreen] = useState(false)
        const [hasNickname, setHasNickname] = useState(false)
        const [loading, setLoading] = useState(true);
        const [playerCount, setPlayerCount] = useState("");
        let nicknameRef = useRef("")

        const [thisUser, setThisUser] = useState(-1); 
        const [playerLeaveFlag, setPlayerLeaveFlag] = useState(false)
        
        const webSocket = 'wss://cambio-backend-2smc.onrender.com/ws/lobby'

    // as lobbyID is taken from the URL and passed into lobbyContent,
    // it needs to be saved to the useContext for use in other files
    useEffect(()=>(
        setLobbyID(lobbyID)
    ), []);

    // manages a websocket connection to the backend and handles any broadcasts sent from the backend
    useEffect(() => {
        const socket = new WebSocket(webSocket);
        const client = Stomp.over(socket);

        client.debug = () => {};
        client.connect({}, () => {
            client.subscribe(`/topic/${lobbyID}`, (message) => {
                const recievedMessage = JSON.parse(message.body);
                if (recievedMessage.playerReadyArray !== null){
                    setMessageArray(recievedMessage.playerReadyArray)
                }
                if (recievedMessage.type === "enterGameView"){
                    setGameScreen(true);
                }
                else if (recievedMessage.type === "removedPlayer"){
                    setPlayerLeaveFlag(true)
                }   
            },
            (error) => {console.error("error subscribing: ", error)}
        )},
        (error) => {console.error("websocket connection failed: ", error)})

        window.addEventListener("beforeunload", handleUnload)
        return() => {window.removeEventListener("beforeunload", handleUnload)}   
    }, [lobbyID]);

    /**
     * posts to the backend on tab exit
     * 
     * .sendBeacon() is used to ensure the post sends even in event of forced tab closure
     */
    const handleUnload = () => {
        navigator.sendBeacon(
            backendSite + `removePlayer/${lobbyID}`,
            (nicknameRef.current)
        );
    };

    useEffect(()=>{
        if (cards){
            for (let x = 2; x < cards.length; x++){
                for (let y = 0; y < cards[x].length; y++){
                    if (cards[x][y]){
                        cards[x][y].card.visible = true;
                    }
                }
            }
        }
        trigger(triggerVar+1)
        console.log("cards: ", cards)
    }, [cards])
    
    // once all player's have readied up, fetches the cards from the backend to correctly display the game board
    useEffect( ()=>{
        const gameStartFunc = async () => {
            if (gameScreen){
                setPlayerCount(messageArray.length)
                try{
                    const result = await axios.post(backendSite + `getCards/${lobbyID}`)
                    if (result.data != null){
                        setCards(result.data.cards)
                        result.data.cards[thisUser+2][0].card.visible = true;
                        result.data.cards[thisUser+2][1].card.visible = true;
                    }
                }
                catch(e){
                    console.error("ERROR: ", e)
                }
            }
        }
        gameStartFunc() 
    }, [gameScreen, playerLeaveFlag])


    // fetches the index of the current player from the playerList stored in the backend,
    // sets their bottom two cards to visible, preparing for the start of the game
    useEffect( () => {
        const getUserIndex = async () => {
            if (hasNickname){
                try{
                    const result = await axios.post(backendSite + `getThisUserIndex/${lobbyID}`, {nickname: nicknameRef.current})
                    if (result.data !== -1){
                        setThisUser(result.data)
                    }
                }
                catch(e){
                    console.error("ERROR: ", e)
                }
            }
        }
        getUserIndex()
    }, [hasNickname, playerLeaveFlag])


    useEffect( () => {
        const updateUserIndex = async () => {
            console.log("userIndex to be updated")
            if (hasNickname){
                try{
                    const result = await axios.post(backendSite + `getThisUserIndex/${lobbyID}`, {nickname: nicknameRef.current})
                    if (result.data !== -1){
                        setThisUser(result.data)
                    }
                }
                catch(e){
                    console.error("ERROR: ", e)
                }
                setPlayerLeaveFlag(false)
            }
        }
        updateUserIndex()
    }, [playerLeaveFlag])

    /**
     * checks if the lobby the user has entered exists or not
     * 
     * ** homepage deals with any attempts to join non existent lobbies via the webpage, but
     * this prevents users from typing incorrect lobby codes in the URL and being able to join
     * non existent lobbies
     */
    const checkLobby = async () => {
        try{
            const result = await axios.post(backendSite + `verifyHomePageData`, {id : lobbyID});
            if (result.data === 3) setExists(true);
            else setExists(false);

            setLoading(false);
        }
        catch(e) {console.error(e)}
    }

    // runs the checkLobby function once only when the user first loads the lobbyPage
    useEffect(() => { checkLobby() }, []);

    if (!gameScreen){
        return(
            <div className="body-container">
            <div className="contents-container">
                {!exists && !loading && (<ErrorView/>)}

                {!hasNickname && exists && (
                    <EnterNicknameView
                        nicknameRef={nicknameRef}
                        setHasNickname={setHasNickname}
                    />)}

                {exists && !loading && hasNickname && (<LobbyReadyUpView messageArray={messageArray}/>)}
            </div>
        </div>
        )
    }
    else{
        return(
            <GamePage
                lobbyID={lobbyID}
                players = {playerCount} 
                thisUser = {thisUser}
                setGameScreen = {setGameScreen}
                cards={cards}
                setCards={setCards}/>
        )
    }
}

export default LobbyContent;