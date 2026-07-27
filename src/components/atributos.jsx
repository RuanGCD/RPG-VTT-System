function CampoAtributo({ nome }){
    return(
        <div className="campo">
            <label>{nome}</label>
            <input type="number"></input>
        </div>
    )
}
export default CampoAtributo;