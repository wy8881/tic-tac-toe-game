import {useState} from 'react'
export default function Player({initialName, symbol, isActive, onNameChange}) {
    const [name, setName] = useState(initialName)
    const [isEditing, setIsEditing] = useState(false)

    function handleEdit() {
        setIsEditing((editing) => !editing)
        if(isEditing) {
            onNameChange(symbol, name)
        }
    }
    function handleChange(event) {
        setName(event.target.value)
    }
    let editablePlayerName = <span className={'player-name'}>{name}</span>

    if (isEditing) {
        editablePlayerName = <input type="text" required value={name} defaultValue = {initialName} onChange={handleChange}/>
    }



    return (
        <li className={isActive ? 'active' : undefined}>
            <span className="player">
                {editablePlayerName}
                <span className="player-symbol">{symbol}</span>
            </span>

            <button onClick={handleEdit}>{isEditing ? 'Save' : 'Edit'}</button>
        </li>
    )
}